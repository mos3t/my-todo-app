import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const ForgotPassword = () => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.mainContainer}>
                        <Text style={styles.title}>Forgot Password</Text>
                        <TextInput 
                            style={styles.input} 
                    placeholder="Enter your email" 
                keyboardType="email-address" 
            />
            <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
        </View>
    );
};

export default ForgotPassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5', // Example background color
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        marginBottom:20,
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
        width: '80%',
    },
    button: {
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
        width: '80%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    gradient: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    mainContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
});