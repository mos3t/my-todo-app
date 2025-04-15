import React from 'react'
import { Stack } from 'expo-router'

const Layout = () => {
  return (
    <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
            name="register" 
            options={{ 
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: 'horizontal'
            }} 
        />
        <Stack.Screen 
            name="forgot-password" 
            options={{ 
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: 'horizontal'
            }} 
        />
    </Stack>
  )
}

export default Layout
