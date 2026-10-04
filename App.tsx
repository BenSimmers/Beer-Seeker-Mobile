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
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ToastProvider } from "./src/components/Toast";
import { BrowseScreen } from "./src/screens/BrowseScreen";
import { CompassScreen } from "./src/screens/CompassScreen";
import { FavouritesScreen } from "./src/screens/FavouritesScreen";
import { AboutScreen } from "./src/screens/AboutScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SocialScreen } from "./src/screens/SocialScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ConnectionsScreen } from "./src/screens/ConnectionsScreen";
import { EditProfileScreen } from "./src/screens/EditProfileScreen";
import type {
  CompassStackParamList,
  FriendsStackParamList,
  SettingsStackParamList,
} from "./src/navigation/types";
import { BackendProvider, backendConfigured } from "./src/backend";
import { FavouritesProvider, FavouritesSync, useFavourites } from "./src/favourites";
import { LocationProvider } from "./src/location";
import { PreferencesProvider, usePreferences } from "./src/preferences";
import { LocationPublisher } from "./src/sharing";
import { ageVerifiedStore } from "./src/storage";
import { fonts, makeStyles, makeThemed, useTheme } from "./src/theme";

const Tab = createBottomTabNavigator();
const CompassStack = createNativeStackNavigator<CompassStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();

const CompassNavigator = () => (
  <CompassStack.Navigator screenOptions={{ headerShown: false }}>
    <CompassStack.Screen name="CompassHome" component={CompassScreen} />
    <CompassStack.Screen name="Favourites" component={FavouritesScreen} />
  </CompassStack.Navigator>
);

// Profiles and lists are only reachable from FriendsHome once signed in, and
// they need the Convex client — so they're only ever mounted with a backend.
const FriendsNavigator = () => (
  <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
    <FriendsStack.Screen name="FriendsHome" component={SocialScreen} />
    <FriendsStack.Screen name="Profile" component={ProfileScreen} />
    <FriendsStack.Screen name="Connections" component={ConnectionsScreen} />
    <FriendsStack.Screen name="EditProfile" component={EditProfileScreen} />
  </FriendsStack.Navigator>
);

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
}) => <Ionicons name={name} size={26} color={color} />;

const renderCompassIcon = ({ color }: { color: string }) => (
  <TabIcon color={color} name={"compass"} />
);

const renderBrowseIcon = ({ color }: { color: string }) => <TabIcon name="menu" color={color} />;

const renderSocialIcon = ({ color }: { color: string }) => <TabIcon name="people" color={color} />;

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
          tabBarShowLabel: false,
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
          component={CompassNavigator}
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
          name="Friends"
          component={FriendsNavigator}
          options={{
            tabBarIcon: renderSocialIcon,
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
  const { hydrated: favouritesHydrated } = useFavourites();
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
    ageVerifiedStore.read().then(setAgeVerified);
  }, []);

  if (ageVerified === null || !fontsSettled || !hydrated || !favouritesHydrated) {
    return <View style={styles.blank} />;
  }

  if (!ageVerified) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onVerified={() => setAgeVerified(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="light" />
        <LocationProvider>
          {backendConfigured && (
            <>
              <LocationPublisher />
              <FavouritesSync />
            </>
          )}
          <MainTabs />
        </LocationProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <BackendProvider>
      <PreferencesProvider>
        <FavouritesProvider>
          <AppRoot />
        </FavouritesProvider>
      </PreferencesProvider>
    </BackendProvider>
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
}));
