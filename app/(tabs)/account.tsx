import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, Platform } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const { user, userDetails, signOut } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Profile Settings',
      icon: 'person',
      onPress: () => Alert.alert('Coming Soon', 'Profile settings will be available soon!'),
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon!'),
    },
    {
      title: 'Privacy',
      icon: 'lock-closed',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon!'),
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => Alert.alert('Coming Soon', 'Help & support will be available soon!'),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingTop: Platform.OS === 'ios' ? 0 : 40 
        }}
      >
        {/* Header */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <View 
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50,
              backgroundColor: '#E5E7EB',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <Ionicons name="person-circle" size={80} color="#9CA3AF" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
            {userDetails?.name || 'Loading...'}
          </Text>
          <Text style={{ color: '#6B7280', marginBottom: 16 }}>
            {userDetails?.email || user?.email}
          </Text>
        </View>

        {/* Menu Items */}
        <View style={{ paddingHorizontal: 20 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              onPress={item.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: '#E5E7EB'
              }}
            >
              <Ionicons name={item.icon as any} size={24} color="#4B5563" style={{ marginRight: 16 }} />
              <Text style={{ flex: 1, fontSize: 16, color: '#1F2937' }}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            marginTop: 32,
            marginHorizontal: 20,
            marginBottom: 40,
            backgroundColor: '#EF4444',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
