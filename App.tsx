import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold
} from '@expo-google-fonts/nunito';
import * as SplashScreenExpo from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PlayerProvider } from './src/context/PlayerContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import SplashScreen from './src/screens/SplashScreen';
import MainTabs from './src/navigation/MainTabs';
import PlayerScreen from './src/screens/PlayerScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import ArtistScreen from './src/screens/ArtistScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/data/mockData';
import { UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Keep splash visible while loading fonts
SplashScreenExpo.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
  });

  // Hide splash as soon as fonts are ready OR on error (prevents freezing on splash forever)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreenExpo.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaProvider style={{ backgroundColor: COLORS.background }}>
        <AuthProvider>
          <ToastProvider>
            <PlayerProvider>
              <NavigationContainer theme={{
                ...DarkTheme,
                colors: {
                  ...DarkTheme.colors,
                  background: COLORS.background,
                  card: COLORS.background,
                }
              }}>
                <RootNavigator />
              </NavigationContainer>
            </PlayerProvider>
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const RootNavigator = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false, 
        animation: 'fade_from_bottom',
        contentStyle: { backgroundColor: COLORS.background }
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen
            name="Album"
            component={AlbumScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Artist"
            component={ArtistScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
