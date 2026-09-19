import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import appJson from "../../../app.json";
import { SEARCH_RADIUS_M } from "../../config";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";

type Page = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string[];
};

const RADIUS_KM = SEARCH_RADIUS_M / 1000;

const PAGES: Page[] = [
  {
    icon: "beer-outline",
    title: "Beer Seeker",
    body: [
      "A compass for the nearest drink.",
      "Point the phone, follow the needle, arrive thirsty.",
    ],
  },
  {
    icon: "people-outline",
    title: "About Us",
    body: [
      "We're Ben, Sam and Josh — and we created This Beer Seeker App.",
      "We're massive history buffs. One fact we love was that in the Middle Ages most people couldn't read, so they navigated by landmarks instead - a sign had to be vivid enough for anyone to recognise at a glance, which is why England still has The Blue Boar, The White Hart and The King's Head.",
      "A habit the Romans started, hanging vine leaves outside a tavern to show it sold wine.",
      "That's where Beer Seeker came from. We built it as a return to true form for travelling and looking for pubs",
    ],
  },
  {
    icon: "compass-outline",
    title: "The Compass",
    body: [
      "The needle reads your device's magnetometer and swings to the closest liquor store, turning with you as you walk.",
      "Tap the map underneath for a closer look, or switch between the Modern and Classic faces in Settings.",
    ],
  },
  {
    icon: "list-outline",
    title: "Browse",
    body: [
      `Every bar, pub, sports bar, brewery, wine bar and bottle shop within ${RADIUS_KM} km, sorted by distance.`,
      "Filter by type or search by name, then open a venue for its rating, opening hours and phone number.",
    ],
  },
];

export const AboutScreen: React.FC = () => {
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useStyles();

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1)));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to settings"
        >
          <Ionicons name="chevron-back" size={16} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
      >
        {PAGES.map((p) => (
          <ScrollView
            key={p.title}
            style={{ width }}
            contentContainerStyle={styles.page}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconRing}>
              <Ionicons name={p.icon} size={30} color={colors.primary} />
            </View>
            <Text style={styles.pageTitle}>{p.title}</Text>
            <View style={styles.divider} />
            {p.body.map((line) => (
              <Text key={line} style={styles.pageBody}>
                {line}
              </Text>
            ))}
          </ScrollView>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {PAGES.map((p, i) => (
          <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.footnote}>Version {appJson.expo.version}</Text>
    </SafeAreaView>
  );
};
