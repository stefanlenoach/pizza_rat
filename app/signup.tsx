import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, Platform, KeyboardAvoidingView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) throw signUpError;

      // On successful signup, show success message and redirect to login
      alert('Please check your email to verify your account');
      router.replace('/login');
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'white' }}
    >
      <StatusBar style="dark" />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Image
            source={require('../assets/images/icon.png')}
            style={{ width: 128, height: 128 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 32 }}>Create Account</Text>
        </View>

        {error ? (
          <Text style={{ color: '#EF4444', marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        <View style={{ gap: 16 }}>
          <TextInput
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16
            }}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16
            }}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16
            }}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1
            }}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <Text style={{ color: '#4B5563' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
