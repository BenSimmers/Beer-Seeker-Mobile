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
import appJson from "../../app.json";
import { SEARCH_RADIUS_M } from "../config";
import { fonts, makeStyles, useTheme } from "../theme";

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

  // Paged offsets are multiples of the page width, so rounding gives the index.
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
        {/* Balances the back button so the title stays centred. */}
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

const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnSpacer: {
    width: 32,
  },
  pager: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingVertical: 20,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 24,
    marginTop: 20,
    textAlign: "center",
  },
  divider: {
    width: 44,
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  pageBody: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.muted,
    opacity: 0.4,
  },
  dotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
  },
  footnote: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: "center",
    paddingTop: 14,
    paddingBottom: 10,
  },
}));
