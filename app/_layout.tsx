import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontProvider } from '@/components/FontProvider';
import { UserProvider } from '../contexts/UserContext';
import { CardBeltProvider } from '../contexts/CardBeltContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useColorScheme } from '@/hooks/useColorScheme';
import '../global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'Zodiak': require('../assets/fonts/Zodiak-Bold.otf'),         // default
    'Zodiak-200': require('../assets/fonts/Zodiak-Thin.otf'),         // Thin
    'Zodiak-300': require('../assets/fonts/Zodiak-Light.otf'),         // Light
    'Zodiak-400': require('../assets/fonts/Zodiak-Bold.otf'),         // Regular
    'Zodiak-500': require('../assets/fonts/Zodiak-Bold.otf'),         // Bold
    'Zodiak-600': require('../assets/fonts/Zodiak-Extrabold.otf'),         // Extrabold
    'Zodiak-700': require('../assets/fonts/Zodiak-Black.otf'),         // Black
    'Zodiak-800': require('../assets/fonts/Zodiak-Black.otf'),
    'Zodiak-900': require('../assets/fonts/Zodiak-Black.otf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ClashDisplay: require('../assets/fonts/ClashDisplay-Variable.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
      <FontProvider>
        <UserProvider>
          <CardBeltProvider>
            <ProtectedRoute>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen 
                    name="account" 
                    options={{ 
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom'
                    }} 
                  />
                  <Stack.Screen 
                    name="login" 
                    options={{ 
                      headerShown: false,
                      presentation: 'modal'
                    }} 
                  />
                  <Stack.Screen 
                    name="signup" 
                    options={{ 
                      headerShown: false,
                      presentation: 'modal'
                    }} 
                  />
                  <Stack.Screen name="+not-found" />
                  <Stack.Screen 
                    name="others/quiz" 
                    options={{ 
                      headerShown: false,
                      animation: 'slide_from_right'
                    }} 
                  />
                  <Stack.Screen 
                    name="others/trading-card-preview" 
                    options={{ 
                      headerShown: false,
                      animation: 'slide_from_right'
                    }} 
                  />
                </Stack>
                <StatusBar style="dark" />
              </ThemeProvider>
            </ProtectedRoute>
          </CardBeltProvider>
        </UserProvider>
      </FontProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
