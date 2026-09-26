import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CategoryChips } from "../../components/CategoryChips";
import { SearchStatus } from "../../components/SearchStatus";
import { StoreMapModal } from "../../components/StoreMapModal";
import { TravelToggle } from "../../components/TravelToggle";
import {
  ErrorBanner,
  Eyebrow,
  MutedText,
  PageTitle,
  SearchField,
  SectionLabel,
} from "../../components/ui";
import { VenueCard } from "../../components/VenueCard";
import { SEARCH_RADIUS_M } from "../../config";
import { useFavourites } from "../../favourites";
import { useNearbyPlaces } from "../../hooks/useNearbyPlaces";
import { useTextSearch } from "../../hooks/useTextSearch";
import { useTheme } from "../../theme";
import type { CategoryFilter, NearbyPlace } from "../../types";
import { arrangePlaces, countByCategory } from "./arrangePlaces";
import { FilterSheet } from "./FilterSheet";
import { useStyles } from "./styles";

export const BrowseScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NearbyPlace | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [openFirst, setOpenFirst] = useState(true);
  const { places, userLocation, error, loading, refresh } = useNearbyPlaces();
  const { favouriteKeys, isFavourite, toggleFavourite } = useFavourites();
  const travelLabel = userLocation?.source === "travel" ? userLocation.label : null;
  const query = search.trim();

  const openMap = (place: NearbyPlace) => {
    setSelected(place);
    setMapVisible(true);
  };

  const counts = useMemo(() => countByCategory(places), [places]);

  const visiblePlaces = useMemo(
    () => arrangePlaces(places, { filter, search, openFirst, favouriteKeys }),
    [places, filter, search, openFirst, favouriteKeys],
  );

  // The local filter is instant and free, so it goes first; the billed search
  // only runs at the moment it dead-ends.
  const {
    results: remote,
    error: remoteError,
    loading: remoteLoading,
  } = useTextSearch(search, userLocation, visiblePlaces.length === 0);

  const sections = useMemo(() => {
    const nearbyKeys = new Set(visiblePlaces.map(placeKey));
    const further = remote.filter((p) => !nearbyKeys.has(placeKey(p)));
    return [
      ...(visiblePlaces.length > 0 ? [{ title: "Nearby", data: visiblePlaces }] : []),
      ...(further.length > 0 ? [{ title: "Further afield", data: further }] : []),
    ];
  }, [visiblePlaces, remote]);

  const emptyMessage = query
    ? `Nothing found for “${query}”.`
    : travelLabel
      ? `No places found near ${travelLabel}.`
      : "No places found nearby.";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <Eyebrow>Compass</Eyebrow>
        <View style={styles.topBarActions}>
          <TravelToggle />
          <Pressable
            style={styles.filterBtn}
            onPress={() => setFiltersVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <Ionicons
              name={openFirst ? "funnel" : "funnel-outline"}
              size={18}
              color={openFirst ? colors.primary : colors.muted}
            />
          </Pressable>
        </View>
      </View>

      <PageTitle
        style={styles.pageTitle}
        title="Nearby Venues"
        subtitle={
          travelLabel
            ? `Exploring venues around ${travelLabel}.`
            : "Explore premium venues in your vicinity."
        }
        accessory={
          places.length > 0 && (
            <View style={styles.countPill}>
              <View style={styles.countDot} />
              <Text style={styles.countText}>
                {places.length} within {SEARCH_RADIUS_M / 1000} km
              </Text>
            </View>
          )
        }
      />

      <SearchField
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder="Search destinations…"
      />

      <CategoryChips value={filter} onChange={setFilter} counts={counts} />

      {error ? (
        <ErrorBanner message={error} style={styles.errorBanner} />
      ) : (
        <SectionList
          sections={sections}
          // Coordinates identify a place independently of its position in the
          // list, so rows move rather than remount when the sort order shifts.
          keyExtractor={placeKey}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <VenueCard
              place={item}
              userLocation={userLocation}
              favourite={isFavourite(item)}
              onToggleFavourite={() => toggleFavourite(item)}
              onPress={() => openMap(item)}
            />
          )}
          // One section on its own is just "the list" — a header would be noise.
          renderSectionHeader={({ section }) =>
            sections.length > 1 ? (
              <SectionLabel style={styles.sectionHeader}>{section.title}</SectionLabel>
            ) : null
          }
          ListFooterComponent={
            <SearchStatus
              loading={remoteLoading}
              error={remoteError}
              // Nothing local matched and the query is too short to widen the net.
              hint={visiblePlaces.length === 0 && query.length > 0 && !remoteLoading}
              query={query}
            />
          }
          ListEmptyComponent={
            !loading && !remoteLoading ? (
              <MutedText style={styles.emptyText}>{emptyMessage}</MutedText>
            ) : null
          }
        />
      )}

      {/* `selected` outlives `mapVisible` so the sheet doesn't blank out
          mid-way through the dismiss animation. */}
      <StoreMapModal
        store={selected}
        userLocation={userLocation}
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
      />

      <FilterSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        openFirst={openFirst}
        onOpenFirstChange={setOpenFirst}
      />
    </SafeAreaView>
  );
};

/** Coordinates, not list position — stable across re-sorts and across sections. */
const placeKey = (p: NearbyPlace) => `${p.name}-${p.lat}-${p.lng}`;
