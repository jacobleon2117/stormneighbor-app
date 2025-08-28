import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen 
          name="welcome" 
          options={{
            title: 'Welcome',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Sign In',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{
            title: 'Create Account',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{
            title: 'Reset Password',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="location-permissions" 
          options={{
            title: 'Location Permissions',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="home-address-setup" 
          options={{
            title: 'Home Address',
            headerShown: false,
          }} 
        />
      </Stack>
    </>
  );
}