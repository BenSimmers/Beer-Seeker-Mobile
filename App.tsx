import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  useFonts as useHankenGrotesk,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AGE_VERIFIED_KEY, AgeGate } from "./src/components/AgeGate";
import { ToastProvider } from "./src/components/Toast";
import { BrowseScreen } from "./src/screens/BrowseScreen";
import { CompassScreen } from "./src/screens/CompassScreen";
import { AboutScreen } from "./src/screens/AboutScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import type { SettingsStackParamList } from "./src/navigation/types";
import { PreferencesProvider, usePreferences } from "./src/preferences";
import { fonts, makeStyles, makeThemed, useTheme } from "./src/theme";

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

/** The Settings tab is a stack so About can be pushed on top of it. */
const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
    <SettingsStack.Screen name="About" component={AboutScreen} />
  </SettingsStack.Navigator>
);

const useNavTheme = makeThemed(
  (colors): Theme => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.headline,
      border: colors.border,
      primary: colors.primary,
    },
  }),
);

const TabIcon: React.FC<{ name: keyof typeof Ionicons.glyphMap; color: string }> = ({
  name,
  color,
}) => {
  const styles = useStyles();
  return <Ionicons name={name} size={18} color={color} style={styles.tabIcon} />;
};

const renderCompassIcon = ({ color }: { color: string }) => (
  <TabIcon name="compass" color={color} />
);

const renderBrowseIcon = ({ color }: { color: string }) => <TabIcon name="menu" color={color} />;

const renderSettingsIcon = ({ color }: { color: string }) => (
  <TabIcon name="settings-sharp" color={color} />
);

const TAB_BAR_CONTENT_HEIGHT = 44;

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const navTheme = useNavTheme();

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
            },
          ],
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Compass"
          component={CompassScreen}
          options={{
            tabBarIcon: renderCompassIcon,
          }}
        />
        <Tab.Screen
          name="Browse"
          component={BrowseScreen}
          options={{
            tabBarIcon: renderBrowseIcon,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsNavigator}
          options={{
            tabBarIcon: renderSettingsIcon,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

function AppRoot() {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const styles = useStyles();
  const { hydrated } = usePreferences();
  const [hankenLoaded, hankenError] = useHankenGrotesk({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });
  const [spaceLoaded, spaceError] = useSpaceGrotesk({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const fontsSettled = (hankenLoaded || !!hankenError) && (spaceLoaded || !!spaceError);

  useEffect(() => {
    AsyncStorage.getItem(AGE_VERIFIED_KEY)
      .catch(() => null)
      .then((v) => setAgeVerified(v === "true"));
  }, []);

  if (ageVerified === null || !fontsSettled || !hydrated) {
    return <View style={styles.blank} />;
  }

  if (!ageVerified) {
    return (
      <SafeAreaProvider>
        <AgeGate onVerified={() => setAgeVerified(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="light" />
        <MainTabs />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AppRoot />
    </PreferencesProvider>
  );
}

const useStyles = makeStyles((colors) => ({
  blank: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tabIcon: {
    marginBottom: 2,
  },
}));
