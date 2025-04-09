import { View, TouchableOpacity, Alert, Linking, Text, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Account',
      icon: 'person-outline' as const,
      onPress: () => router.push('/account')
    },
    {
      title: 'Send feedback',
      icon: 'mail-outline' as const,
      onPress: () => Linking.openURL('mailto:feedback@pizzarat.com?subject=Pizza Rat Feedback')
    },
    {
      title: 'Rate our app',
      icon: 'star-outline' as const,
      onPress: () => {
        // Replace with actual App Store/Play Store links when available
        Alert.alert(
          'Rate Pizza Rat',
          'Coming soon! The app will be available on the App Store and Play Store.',
        );
      }
    }
  ];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerShown: false
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingTop: Platform.OS === 'ios' ? 0 : 40 
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
            <Text style={{ marginLeft: 8, fontSize: 16, color: '#333' }}>Back</Text>
          </TouchableOpacity>

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
                <Ionicons name={item.icon} size={24} color="#4B5563" style={{ marginRight: 16 }} />
                <Text style={{ flex: 1, fontSize: 16, color: '#1F2937' }}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
