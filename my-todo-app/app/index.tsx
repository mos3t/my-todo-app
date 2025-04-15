import React, { useState } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ImageBackground, Alert, ActivityIndicator, StatusBar, Image } from 'react-native'
import { Link, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { getAccounts } from './accounts/accountUtils'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Index = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Get all accounts from the JSON file
            const accounts = await getAccounts();
            
            // Find an account with matching email and password
            const matchingAccount = accounts.find(
                account => account.email === email && account.password === password
            );
            
            if (matchingAccount) {
                // Store the user's email and password in AsyncStorage
                await AsyncStorage.setItem('userEmail', email);
                await AsyncStorage.setItem('userPassword', password);
                // Login successful
                router.replace('/(tabs)/home');
            } else {
                // Login failed
                Alert.alert('Error', 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop' }}
                style={styles.backgroundImage}
            >
                <LinearGradient
                    colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.mainContainer}>
                        <View style={styles.logoSection}>
                            <Image 
                                source={require('/Users/mauricescheunert/my-todo-app/logo/logo-transparent.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.logoText}>TaskFlow</Text>
                            <Text style={styles.tagline}>Organize. Focus. Achieve.</Text>
                        </View>
                        
                        <View style={styles.formSection}>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="rgba(255,255,255,0.7)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255,255,255,0.7)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeIcon} 
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.loginButton, isLoading && styles.disabledButton]} 
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>
                            
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Don't have an account? </Text>
                                <Link href="/register" style={styles.registerLink}>
                                    <Text style={styles.registerLinkText}>Sign Up</Text>
                                </Link>
                            </View> 
                            <View style={styles.footerpassword}>
                                <Link href="/forgot-password" style={styles.forgotpasswordlink}>
                                    <Text style={styles.forgotpasswordlinkText}>Forgot Password?</Text>
                                </Link>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    )
}

export default Index

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding:20,
    },
    mainContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    formSection: {
        width: '100%',
    },
    logoImage: {
        width: 130,
        height: 130,
        marginBottom: 15,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 5,
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        position: 'relative',
    },
    passwordInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 15,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        padding: 5,
    },
    loginButton: {
        backgroundColor: '#5E60CE',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    disabledButton: {
        backgroundColor: '#6c757d',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    footerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    registerLink: {
        marginLeft: 5,
    },
    registerLinkText: {
        color: '#5E60CE',
        fontSize: 14,
        fontWeight: 'bold',
    },
    forgotpasswordlink: {
        marginLeft: 5,
    },
    forgotpasswordlinkText: {
        color: '#5E60CE',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footerpassword: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
})