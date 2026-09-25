import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavourites, toFavourite } from "../favourites";
import type { FavouriteInput } from "../favourites";
import { MIN_QUERY_LENGTH, useTextSearch } from "../hooks/useTextSearch";
import { useUserLocation } from "../hooks/useUserLocation";
import type { CompassStackParamList } from "../navigation/types";
import { CATEGORY_LABELS } from "../types";
import type { UserLocation } from "../types";
import { fonts, makeStyles, useTheme } from "../theme";
import {
  bearingToCardinal,
  calculateBearing,
  formatDistance,
  haversineDistance,
} from "../utils/geo";

type RowProps = {
  place: FavouriteInput;
  userLocation: UserLocation | null;
  favourite: boolean;
  onToggle: () => void;
  onPress: () => void;
};

/** One place, however it got here — a saved pin or a search hit. */
const PlaceRow: React.FC<RowProps> = ({ place, userLocation, favourite, onToggle, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const distance = userLocation
    ? haversineDistance(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;
  const bearing = userLocation
    ? calculateBearing(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;

  return (
    <Pressable
      style={[styles.row, favourite && styles.rowFavourite]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Point the compass at ${place.name}`}
    >
      <Pressable
        style={styles.star}
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="switch"
        accessibilityState={{ checked: favourite }}
        accessibilityLabel={favourite ? `Unpin ${place.name}` : `Pin ${place.name}`}
      >
        <Ionicons
          name={favourite ? "star" : "star-outline"}
          size={20}
          color={favourite ? colors.primary : colors.muted}
        />
      </Pressable>

      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {place.category !== "other" ? `${CATEGORY_LABELS[place.category]} · ` : ""}
          {place.vicinity}
        </Text>
        {distance != null && bearing != null && (
          <Text style={styles.rowDistance}>
            {formatDistance(distance)} · {bearingToCardinal(bearing)}
          </Text>
        )}
      </View>

      <Ionicons name="compass-outline" size={18} color={colors.primary} />
    </Pressable>
  );
};

export const FavouritesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<CompassStackParamList>>();
  const { favourites, isFavourite, toggleFavourite } = useFavourites();
  const { userLocation } = useUserLocation();
  const [query, setQuery] = useState("");

  const { results, error, loading } = useTextSearch(query, userLocation, true);

  const trimmed = query.trim();
  const searching = trimmed.length > 0;
  const rows: FavouriteInput[] = searching ? results : favourites;

  const pointAt = useCallback(
    (place: FavouriteInput) => {
      // Back to the compass, with the needle's new target in hand.
      navigation.navigate("CompassHome", { target: toFavourite(place) });
    },
    [navigation],
  );

  const status = (() => {
    if (!searching) return null;
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return `Type at least ${MIN_QUERY_LENGTH} characters to search.`;
    }
    if (!userLocation) return "Waiting for your location…";
    if (loading) return "Searching…";
    if (error) return error;
    if (results.length === 0) return `Nothing found for “${trimmed}”.`;
    return null;
  })();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to the compass"
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Compass</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favourites</Text>
        <Text style={styles.headerSubtitle}>
          Pin the places you like: they rise to the top of Browse, and tapping one points the
          compass straight at it.
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a place…"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && (
          <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={17} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionLabel}>
        {searching
          ? "Search results"
          : `Saved${favourites.length > 0 ? ` (${favourites.length})` : ""}`}
      </Text>

      <FlatList
        data={rows}
        keyExtractor={(place) => `${place.name}-${place.lat}-${place.lng}`}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <PlaceRow
            place={item}
            userLocation={userLocation}
            favourite={isFavourite(item)}
            onToggle={() => toggleFavourite(item)}
            onPress={() => pointAt(item)}
          />
        )}
        ListEmptyComponent={
          searching ? null : (
            <Text style={styles.emptyText}>
              No favourites yet. Search above and tap a star to pin a place.
            </Text>
          )
        }
        ListFooterComponent={status ? <Text style={styles.status}>{status}</Text> : null}
      />
    </SafeAreaView>
  );
};

const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
  },
  backText: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 32,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.body,
    fontSize: 14,
    height: "100%",
  },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowFavourite: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  star: {
    width: 26,
    alignItems: "center",
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 16,
  },
  rowMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  rowDistance: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 32,
  },
  status: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
  },
}));
