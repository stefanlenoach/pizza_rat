import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Image, ScrollView, Alert } from 'react-native';
import { TouchableOpacity } from '@/components/CustomTouchableOpacity';
import { StatusBar } from 'expo-status-bar';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/CustomText';
import PizzaRatHeader from '@/components/PizzaRatHeader';
import tw from '@/utils/tw';

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock authentication function
  const handleAuth = async (provider: 'google' | 'apple') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // In a real app, this would integrate with Google or Apple authentication
    try {
      setIsSubmitting(true);
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll just pretend authentication succeeded
      if (provider === 'google') {
        // Mock Google auth success
        console.log('Google auth successful');
      } else {
        // Mock Apple auth success
        console.log('Apple auth successful');
      }
      
      // Show username selection after successful auth
      setIsLoggedIn(true);
    } catch (error) {
      console.error(`${provider} authentication error:`, error);
      Alert.alert('Authentication Error', `Could not sign in with ${provider}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Validate username: letters, numbers, underscores, 3-20 characters
    const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(text);
    setIsUsernameValid(isValid);
  };

  const handleSubmitUsername = async () => {
    if (!isUsernameValid) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    
    try {
      // Simulate network request to check if username is available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just pretend username is available
      console.log('Username set successfully:', username);
      
      // Show success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Welcome, ${username}! Your profile has been created.`);
      
      // In a real app, you would store the user profile and update the UI
    } catch (error) {
      console.error('Error setting username:', error);
      Alert.alert('Error', 'Could not set username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar style="dark" />
      <PizzaRatHeader title="Profile" />
      
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
        {!isLoggedIn ? (
          // Authentication screen
          <View style={tw`items-center justify-center py-10`}>
            <Image 
              source={require('@/assets/images/slice.svg')} 
              style={tw`w-24 h-24 mb-8`}
            />
            
            <Text style={tw`text-2xl font-bold mb-2 text-center`}>Sign in to Pizza Rat</Text>
            <Text style={tw`text-base text-gray-600 mb-10 text-center`}>
              Join our community to rate and review your favorite pizza spots
            </Text>
            
            <TouchableOpacity 
              style={tw`flex-row items-center bg-white border border-gray-300 rounded-xl py-4 px-6 mb-4 w-full`}
              onPress={() => handleAuth('google')}
              disabled={isSubmitting}
            >
              <FontAwesome name="google" size={24} color="#DB4437" style={tw`mr-4`} />
              <Text style={tw`text-base font-medium`}>Continue with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`flex-row items-center bg-black rounded-xl py-4 px-6 w-full`}
              onPress={() => handleAuth('apple')}
              disabled={isSubmitting}
            >
              <FontAwesome name="apple" size={24} color="white" style={tw`mr-4`} />
              <Text style={tw`text-base font-medium text-white`}>Continue with Apple</Text>
            </TouchableOpacity>
            
            {isSubmitting && (
              <Text style={tw`mt-6 text-gray-500`}>Authenticating...</Text>
            )}
          </View>
        ) : (
          // Username selection screen
          <View style={tw`items-center justify-center py-10`}>
            <Text style={tw`text-2xl font-bold mb-6 text-center`}>Choose a Username</Text>
            
            <View style={tw`w-full mb-6`}>
              <Text style={tw`text-base font-medium mb-2`}>Username</Text>
              <TextInput
                style={tw`border ${isUsernameValid ? 'border-green-500' : 'border-gray-300'} rounded-xl py-3 px-4 text-base w-full`}
                placeholder="Choose a unique username"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {username.length > 0 && (
                <View style={tw`flex-row items-center mt-2`}>
                  {isUsernameValid ? (
                    <>
                      <AntDesign name="checkcircle" size={16} color="green" style={tw`mr-2`} />
                      <Text style={tw`text-green-600 text-sm`}>Username is available</Text>
                    </>
                  ) : (
                    <>
                      <AntDesign name="exclamationcircle" size={16} color="red" style={tw`mr-2`} />
                      <Text style={tw`text-red-600 text-sm`}>
                        Username must be 3-20 characters (letters, numbers, underscores)
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={tw`bg-red-600 py-4 px-6 rounded-xl w-full ${!isUsernameValid ? 'opacity-50' : ''}`}
              onPress={handleSubmitUsername}
              disabled={!isUsernameValid || isSubmitting}
            >
              <Text style={tw`text-white font-bold text-center text-lg`}>
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
