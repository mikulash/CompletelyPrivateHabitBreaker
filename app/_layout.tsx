import 'react-native-reanimated';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { M3Colors } from '@/constants/theme';
import { TrackedItemsProvider } from '@/contexts/TrackedItemsContext';
import { requestNotificationPermissions } from '../utils/notifications';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
    initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// M3 customized dark theme
const M3DarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: M3Colors.primary,
        background: M3Colors.surface,
        card: M3Colors.surfaceContainer,
        text: M3Colors.onSurface,
        border: M3Colors.outlineVariant,
        notification: M3Colors.error,
    },
};

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });

    // Expo Router uses Error Boundaries to catch errors in the navigation tree.
    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
            requestNotificationPermissions();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider value={M3DarkTheme}>
            <TrackedItemsProvider>
                <Stack
                    screenOptions={{
                        headerStyle: { backgroundColor: M3Colors.surface },
                        headerTintColor: M3Colors.onSurface,
                        headerShadowVisible: false,
                        contentStyle: { backgroundColor: M3Colors.surface },
                    }}
                >
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="tracker/[id]"
                        options={{
                            title: 'Details',
                            headerBackTitle: 'Back',
                        }}
                    />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
            </TrackedItemsProvider>
        </ThemeProvider>
    )
}
