import React, { useState } from 'react';
import { View, TextInput, Image, Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { TouchableOpacity } from '@/components/CustomTouchableOpacity';
import { Text } from '@/components/CustomText';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple } = useUser();
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { error: signInError } = await signInWithGoogle();
      if (signInError) throw signInError;
    } catch (error: any) {
      setError(error.message || 'An error occurred during Google login');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { error: signInError } = await signInWithApple();
      if (signInError) throw signInError;
    } catch (error: any) {
      setError(error.message || 'An error occurred during Apple login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 32 }}>Welcome To Pizza Rat!</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          editable={!loading}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          editable={!loading}
        />

        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={20} color="#000" style={styles.socialIcon} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={handleAppleLogin}
            style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={20} color="#fff" style={styles.socialIcon} />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <Text style={{ color: '#4B5563' }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  logo: {
    width: 128,
    height: 128
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb'
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6b7280'
  },
  socialButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  socialIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  appleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  }
});
