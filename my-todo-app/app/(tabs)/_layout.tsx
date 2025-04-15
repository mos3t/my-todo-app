import { Tabs } from 'expo-router'
import { StyleSheet,Text,View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'

const TabsLayout = () => {
    return (
        <Tabs>
            <Tabs.Screen name="home" options={{
                tabBarIcon:({color,size}) => (
                    <Ionicons name='home' color={color} size={size}></Ionicons>
                ),
                tabBarLabel: 'Home',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                headerShown: false,
            }}></Tabs.Screen>
            <Tabs.Screen name="add" options={{ 
                tabBarIcon:({color,size}) => (
                    <Ionicons name='add' color={color} size={size}></Ionicons>
                ),
                tabBarLabel: 'Add',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                headerShown: false,
            }}></Tabs.Screen>
            <Tabs.Screen name="profile" options={{ 
                tabBarIcon:({color,size}) => (
                    <Ionicons name='person' color={color} size={size}></Ionicons>
                ),
                tabBarLabel: 'Profile',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                headerShown: false,
            }}></Tabs.Screen>
        </Tabs>
)
}

export default TabsLayout

const styles = StyleSheet.create({})