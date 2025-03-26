import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set your Expo project ID here
const EXPO_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId || 'YOUR_EXPO_PROJECT_ID';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  let token;
  
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  // Check if we have permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // If no existing permission, ask for it
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  try {
    // Get the token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID
    })).data;
    
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return;
  }

  // Required for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export async function schedulePushNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: null, // null means show immediately
  });
}

export function addNotificationListener(callback: (notification: Notifications.Notification) => void) {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
}

export function addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
}
