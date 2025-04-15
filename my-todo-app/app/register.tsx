import React, { useState } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ImageBackground, Platform, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { saveAccount, exportAccounts, getAccounts } from './accounts/accountUtils'

const Register = () => {
    const params = useLocalSearchParams();
    const [email, setEmail] = useState(params.email as string || '')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [firstname, setFirstname] = useState('')
    const [lastname, setLastname] = useState('')
    const [birthdate, setBirthdate] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [emailExists, setEmailExists] = useState(false)
    const [usernameExists, setUsernameExists] = useState(false)

    const isEmailValid = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const isPasswordValid = (password: string) => {
        return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(password)
    }

    const isUsernameValid = (username: string) => {
        return username.length >= 3
    }

    const isNameValid = (name: string) => {
        return name.length >= 2
    }

    const isBirthdateValid = (date: string) => {
        return /^\d{2}\.\d{2}\.\d{4}$/.test(date)
    }

    const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}.${month}.${year}`
    }

    const parseDate = (dateStr: string): Date | null => {
        const parts = dateStr.split('.')
        if (parts.length === 3) {
            const day = parseInt(parts[0])
            const month = parseInt(parts[1]) - 1
            const year = parseInt(parts[2])
            const date = new Date(year, month, day)
            if (!isNaN(date.getTime())) {
                return date
            }
        }
        return null
    }

    const handleDateChange = (text: string) => {
        // Allow only numbers and dots
        const cleaned = text.replace(/[^0-9.]/g, '')
        
        // Format as DD.MM.YYYY while typing
        let formatted = cleaned
        if (cleaned.length > 2 && !cleaned.includes('.')) {
            formatted = cleaned.slice(0, 2) + '.' + cleaned.slice(2)
        }
        if (cleaned.length > 5 && formatted.split('.').length === 2) {
            formatted = formatted.slice(0, 5) + '.' + formatted.slice(5)
        }
        
        setBirthdate(formatted)
    }

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false)
        }
        
        if (event.type === 'set' && selectedDate) {
            setBirthdate(formatDate(selectedDate))
        }
    }

    const handleRegister = async () => {
        try {
            // Validate all fields
            if (!isEmailValid(email) || !isPasswordValid(password) || !isUsernameValid(username) || 
                !isNameValid(firstname) || !isNameValid(lastname) || !isBirthdateValid(birthdate)) {
                Alert.alert('Error', 'Please fill all fields correctly');
                return;
            }

            // Get existing accounts
            const accounts = await getAccounts();
            
            // Check if email already exists
            const emailExists = accounts.some(account => account.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                Alert.alert('Error', 'An account with this email already exists');
                return;
            }
            
            // Check if username already exists
            const usernameExists = accounts.some(account => account.username.toLowerCase() === username.toLowerCase());
            if (usernameExists) {
                Alert.alert('Error', 'This username is already taken');
                return;
            }

            // Save account data
            await saveAccount({
                email,
                password,
                username,
                firstname,
                lastname,
                birthdate
            });

            Alert.alert('Success', 'Account created successfully!');
            router.replace('/');
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', 'Failed to create account. Please try again.');
        }
    }


    // Function to check if email or username exists
    const checkExistingCredentials = async (newEmail: string, newUsername: string) => {
        try {
            const accounts = await getAccounts();
            setEmailExists(accounts.some(account => account.email.toLowerCase() === newEmail.toLowerCase()));
            setUsernameExists(accounts.some(account => account.username.toLowerCase() === newUsername.toLowerCase()));
        } catch (error) {
            console.error('Error checking credentials:', error);
        }
    };

    // Update email and check existence
    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (isEmailValid(text)) {
            checkExistingCredentials(text, username);
        }
    };

    // Update username and check existence
    const handleUsernameChange = (text: string) => {
        setUsername(text);
        if (isUsernameValid(text)) {
            checkExistingCredentials(email, text);
        }
    };

  return (
        <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' }}
            style={styles.backgroundImage}
        >
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                style={styles.container}
            >
                <KeyboardAwareScrollView
                    contentContainerStyle={styles.scrollContent}
                    enableOnAndroid
                    enableAutomaticScroll
                    extraScrollHeight={20}
                >
                    <View style={styles.formContainer}>
                        <Text style={styles.headline}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    
                        
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#rgba(255,255,255,0.7)"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {isEmailValid(email) && !emailExists && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
                            {emailExists && <Ionicons name="alert-circle" size={24} color="red" style={styles.checkIcon} />}
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor="#rgba(255,255,255,0.7)"
                                value={username}
                                onChangeText={handleUsernameChange}
                            />
                            {isUsernameValid(username) && !usernameExists && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
                            {usernameExists && <Ionicons name="alert-circle" size={24} color="red" style={styles.checkIcon} />}
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Firstname"
                                placeholderTextColor="#rgba(255,255,255,0.7)"
                                value={firstname}
                                onChangeText={setFirstname}
                            />
                            {isNameValid(firstname) && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Lastname"
                                placeholderTextColor="#rgba(255,255,255,0.7)"
                                value={lastname}
                                onChangeText={setLastname}
                            />
                            {isNameValid(lastname) && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
                        </View>

                        <View style={styles.inputContainer}>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flex: 1 }}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Birthdate"
                                    placeholderTextColor="#rgba(255,255,255,0.7)"
                                    value={birthdate}
                                    onChangeText={handleDateChange}
                                    maxLength={10}
                                    keyboardType="numeric"
                                />
                            </TouchableOpacity>
                            {isBirthdateValid(birthdate) && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
                        </View>

                        {(showDatePicker || Platform.OS === 'ios') && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={birthdate ? parseDate(birthdate) || new Date() : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                            />
                        )}
                        
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#rgba(255,255,255,0.7)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="white" />
                            </TouchableOpacity>
                            {isPasswordValid(password) && <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkIcon} />}
                        </View>
                        
                        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                            <Text style={styles.registerButtonText}>Sign Up</Text>
                        </TouchableOpacity>
    </View>
                </KeyboardAwareScrollView>
            </LinearGradient>
        </ImageBackground>
    )
}

export default Register

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        width: '100%',
    },
    formContainer: {
        width: '85%',
        padding: 20,
        borderRadius: 15,
        alignSelf: 'center',
        marginVertical: 20,
        marginTop: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 15,
        color: 'white',
        fontSize: 16,
    },
    checkIcon: {
        position: 'absolute',
        right: 15,
    },
    eyeIcon: {
        position: 'absolute',
        right: 50,
    },
    headline: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 30,
    },
    registerButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    exportButton: {
        backgroundColor: '#6c757d',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    exportButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
})