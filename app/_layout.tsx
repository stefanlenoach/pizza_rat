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
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useColorScheme } from '@/hooks/useColorScheme';
import '../global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Zodiak: require('../assets/fonts/Zodiak-Variable.ttf'),         // default
    'Zodiak-Italic': require('../assets/fonts/Zodiak-VariableItalic.ttf'),         // italic
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
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </ProtectedRoute>
        </UserProvider>
      </FontProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
