import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MutedText, PageTitle, SearchField, SectionLabel } from "../../components/ui";
import { toFavourite, useFavourites, type FavouriteInput } from "../../favourites";
import { MIN_QUERY_LENGTH, useTextSearch } from "../../hooks/useTextSearch";
import { useLocation } from "../../location";
import type { CompassStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme";
import { PlaceRow } from "./PlaceRow";
import { useStyles } from "./styles";

export const FavouritesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<CompassStackParamList>>();
  const { favourites, isFavourite, toggleFavourite } = useFavourites();
  const { origin: userLocation } = useLocation();
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

      <PageTitle
        style={styles.pageTitle}
        title="Favourites"
        subtitle="Pin the places you like: they rise to the top of Browse, and tapping one points the compass straight at it."
      />

      <SearchField
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        placeholder="Search for a place…"
        returnKeyType="search"
      />

      <SectionLabel style={styles.sectionLabel}>
        {searching
          ? "Search results"
          : `Saved${favourites.length > 0 ? ` (${favourites.length})` : ""}`}
      </SectionLabel>

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
            <MutedText style={styles.emptyText}>
              No favourites yet. Search above and tap a star to pin a place.
            </MutedText>
          )
        }
        ListFooterComponent={status ? <MutedText>{status}</MutedText> : null}
      />
    </SafeAreaView>
  );
};
