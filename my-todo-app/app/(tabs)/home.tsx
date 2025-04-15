import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { format, startOfWeek, endOfWeek, isToday, isSameDay, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  userId: string;
}

const Home = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Load todos from AsyncStorage when component mounts
  useEffect(() => {
    const loadTodos = async () => {
      try {
        // Get the current user's email
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (!userEmail) {
          // If not logged in, redirect to login
          router.replace('/');
          return;
        }
        
        setUserId(userEmail);
        
        // Get todos from AsyncStorage
        const todosJson = await AsyncStorage.getItem('todos');
        if (todosJson) {
          const allTodos: Todo[] = JSON.parse(todosJson);
          
          // Filter todos for the current user
          const userTodos = allTodos.filter(todo => todo.userId === userEmail);
          
          // Convert date strings back to Date objects
          const processedTodos = userTodos.map(todo => ({
            ...todo,
            dueDate: new Date(todo.dueDate)
          }));
          
          setTodos(processedTodos);
        }
      } catch (error) {
        console.error('Error loading todos:', error);
      }
    };
    
    loadTodos();
  }, []);
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Get the current user's email
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) {
        router.replace('/');
        return;
      }
      
      // Get todos from AsyncStorage
      const todosJson = await AsyncStorage.getItem('todos');
      if (todosJson) {
        const allTodos: Todo[] = JSON.parse(todosJson);
        
        // Filter todos for the current user
        const userTodos = allTodos.filter(todo => todo.userId === userEmail);
        
        // Convert date strings back to Date objects
        const processedTodos = userTodos.map(todo => ({
          ...todo,
          dueDate: new Date(todo.dueDate)
        }));
        
        setTodos(processedTodos);
      }
    } catch (error) {
      console.error('Error refreshing todos:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get today's todos
  const todayTodos = todos.filter(todo => isSameDay(todo.dueDate, new Date()));
  
  // Get weekly todos
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weeklyTodos = todos.filter(todo => 
    todo.dueDate >= weekStart && todo.dueDate <= weekEnd
  );
  
  // Toggle todo completion
  const toggleTodoCompletion = async (id: string) => {
    try {
      // Update the local state
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      setTodos(updatedTodos);
      
      // Get all todos from AsyncStorage
      const todosJson = await AsyncStorage.getItem('todos');
      if (todosJson) {
        const allTodos: Todo[] = JSON.parse(todosJson);
        
        // Update the specific todo
        const updatedAllTodos = allTodos.map(todo => 
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem('todos', JSON.stringify(updatedAllTodos));
      }
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    }
  };
  
  // Render a todo item
  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={styles.todoItem}
      onPress={() => toggleTodoCompletion(item.id)}
    >
      <View style={styles.todoContent}>
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={item.completed ? "#4CAF50" : "#757575"} 
        />
        <View style={styles.todoTextContainer}>
          <Text style={[
            styles.todoText,
            item.completed && styles.completedTodoText
          ]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={styles.todoDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.todoRightContent}>
        <View style={[
          styles.priorityIndicator,
          { backgroundColor: 
            item.priority === 'high' ? '#F44336' : 
            item.priority === 'medium' ? '#FFC107' : '#4CAF50' 
          }
        ]} />
        <Text style={styles.todoDate}>
          {format(item.dueDate, 'MMM d, h:mm a')}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Calendar marked dates
  const getMarkedDates = () => {
    const marked: { [key: string]: { marked: boolean; dotColor: string } } = {};
    todos.forEach(todo => {
      const dateString = format(todo.dueDate, 'yyyy-MM-dd');
      marked[dateString] = { 
        marked: true, 
        dotColor: todo.completed ? '#4CAF50' : '#FF9800' 
      };
    });
    return marked;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/add')}
            >
              <Ionicons name="add-circle" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Ionicons name="calendar" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Calendar */}
        {showCalendar && (
          <View style={styles.calendarContainer}>
            <Calendar
              current={format(selectedDate, 'yyyy-MM-dd')}
              onDayPress={(day: DateData) => setSelectedDate(parseISO(day.dateString))}
              markedDates={getMarkedDates()}
              theme={{
                todayTextColor: '#2196F3',
                selectedDayBackgroundColor: '#2196F3',
                dotColor: '#FF9800',
              }}
            />
    </View>
        )}
        
        {/* Today's Todos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          {todayTodos.length > 0 ? (
            <FlatList
              data={todayTodos}
              renderItem={renderTodoItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No tasks for today</Text>
          )}
        </View>
        
        {/* Weekly Todos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          {weeklyTodos.length > 0 ? (
            <FlatList
              data={weeklyTodos}
              renderItem={renderTodoItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No tasks for this week</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  todoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  todoDescription: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 2,
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  todoRightContent: {
    alignItems: 'flex-end',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  todoDate: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9e9e9e',
    fontStyle: 'italic',
    marginVertical: 16,
  },
});