import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// Define the Todo interface
interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  userId: string; // To associate with the logged-in user
}

const AddTodo = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the current user ID when component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          setUserId(userEmail);
        } else {
          Alert.alert('Error', 'You must be logged in to add todos');
          router.replace('/');
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        Alert.alert('Error', 'Failed to get user information');
      }
    };

    getCurrentUser();
  }, []);

  // Handle date picker changes
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your todo');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to add todos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new todo object
      const newTodo: Todo = {
        id: Date.now().toString(), // Simple ID generation
        title: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
        completed: false,
        userId
      };

      // Get existing todos from AsyncStorage
      const existingTodosJson = await AsyncStorage.getItem('todos');
      const existingTodos: Todo[] = existingTodosJson ? JSON.parse(existingTodosJson) : [];

      // Add the new todo
      const updatedTodos = [...existingTodos, newTodo];

      // Save back to AsyncStorage
      await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));

      Alert.alert('Success', 'Todo added successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
      ]);
    } catch (error) {
      console.error('Error saving todo:', error);
      Alert.alert('Error', 'Failed to save todo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render priority selector
  const renderPrioritySelector = () => (
    <View style={styles.priorityContainer}>
      <Text style={styles.label}>Priority:</Text>
      <View style={styles.priorityButtons}>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === 'low' && styles.priorityButtonSelected,
            { backgroundColor: priority === 'low' ? '#E8F5E9' : '#f5f5f5' }
          ]}
          onPress={() => setPriority('low')}
        >
          <Text style={[
            styles.priorityButtonText,
            priority === 'low' && styles.priorityButtonTextSelected,
            { color: priority === 'low' ? '#4CAF50' : '#757575' }
          ]}>Low</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === 'medium' && styles.priorityButtonSelected,
            { backgroundColor: priority === 'medium' ? '#FFF8E1' : '#f5f5f5' }
          ]}
          onPress={() => setPriority('medium')}
        >
          <Text style={[
            styles.priorityButtonText,
            priority === 'medium' && styles.priorityButtonTextSelected,
            { color: priority === 'medium' ? '#FFC107' : '#757575' }
          ]}>Medium</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === 'high' && styles.priorityButtonSelected,
            { backgroundColor: priority === 'high' ? '#FFEBEE' : '#f5f5f5' }
          ]}
          onPress={() => setPriority('high')}
        >
          <Text style={[
            styles.priorityButtonText,
            priority === 'high' && styles.priorityButtonTextSelected,
            { color: priority === 'high' ? '#F44336' : '#757575' }
          ]}>High</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Task</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#9e9e9e"
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter task description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9e9e9e"
              />
            </View>

            {/* Due Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#757575" />
                <Text style={styles.dateText}>
                  {format(dueDate, 'MMM d, yyyy h:mm a')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="datetime"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Priority Selector */}
            {renderPrioritySelector()}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Adding...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Add Task</Text>
              )}
            </TouchableOpacity>
    </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddTodo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    marginBottom: 20,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priorityButtonSelected: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  priorityButtonTextSelected: {
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});