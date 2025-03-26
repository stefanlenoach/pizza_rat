import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, Platform, KeyboardAvoidingView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      // On successful login, redirect to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
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
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 32 }}>Welcome To Pizza Rat!</Text>
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

          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>
              {loading ? 'Logging in...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <Text style={{ color: '#4B5563' }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
