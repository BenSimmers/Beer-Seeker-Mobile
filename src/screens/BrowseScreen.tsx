import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CategoryChips } from "../components/CategoryChips";
import { ErrorBanner } from "../components/common";
import { StoreMapModal } from "../components/StoreMapModal";
import { VenueCard } from "../components/VenueCard";
import { SearchStatus } from "../components/SearchStatus";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { useTextSearch } from "../hooks/useTextSearch";
import type { CategoryFilter, NearbyPlace } from "../types";
import { SEARCH_RADIUS_M } from "../config";
import { fonts, makeStyles, useTheme } from "../theme";

export const BrowseScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NearbyPlace | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortByOpenFirst, setSortByOpenFirst] = useState(false);
  const { places, userLocation, error, loading, refresh } = useNearbyPlaces();

  const openMap = (place: NearbyPlace) => {
    setSelected(place);
    setMapVisible(true);
  };

  // Totals for the chip labels: every nearby place, not just the visible ones.
  const counts = useMemo(() => {
    const tally: Partial<Record<CategoryFilter, number>> = { all: places.length };
    for (const p of places) {
      if (p.category !== "other") tally[p.category] = (tally[p.category] ?? 0) + 1;
    }
    return tally;
  }, [places]);

  const visiblePlaces = useMemo(() => {
    const byCategory = filter === "all" ? places : places.filter((p) => p.category === filter);
    const query = search.trim().toLowerCase();
    let filtered = byCategory;
    if (query) {
      filtered = byCategory.filter(
        (p) => p.name.toLowerCase().includes(query) || p.vicinity.toLowerCase().includes(query),
      );
    }

    if (!sortByOpenFirst) return filtered;

    const open = filtered.filter((p) => p.openNow === true).sort((a, b) => a.distance - b.distance);
    const closed = filtered.filter((p) => p.openNow !== true);
    return [...open, ...closed];
  }, [places, filter, search, sortByOpenFirst]);

  // The local filter is instant and free, so it goes first; the billed search
  // only runs at the moment it dead-ends.
  const {
    results: remote,
    error: remoteError,
    loading: remoteLoading,
  } = useTextSearch(search, userLocation, visiblePlaces.length === 0);

  // Category chips deliberately don't filter these: a typed query is a more
  // specific request than a chip, and the wider search returns plenty of places
  // Google files under no category we track.
  const sections = useMemo(() => {
    const nearbyKeys = new Set(visiblePlaces.map(placeKey));
    const further = remote.filter((p) => !nearbyKeys.has(placeKey(p)));
    return [
      ...(visiblePlaces.length > 0 ? [{ title: "Nearby", data: visiblePlaces }] : []),
      ...(further.length > 0 ? [{ title: "Further afield", data: further }] : []),
    ];
  }, [visiblePlaces, remote]);

  const searchStatus = {
    loading: remoteLoading,
    error: remoteError,
    // Nothing local matched and the query is too short to widen the net.
    hint: visiblePlaces.length === 0 && search.trim().length > 0 && !remoteLoading,
    query: search.trim(),
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Compass</Text>
        <Pressable
          style={[styles.sortBtn, sortByOpenFirst && styles.sortBtnActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name={sortByOpenFirst ? "funnel" : "funnel-outline"}
            size={18}
            color={sortByOpenFirst ? colors.primary : colors.muted}
          />
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Nearby Venues</Text>
          {places.length > 0 && (
            <View style={styles.countPill}>
              <View style={styles.countDot} />
              <Text style={styles.countText}>
                {places.length} within {SEARCH_RADIUS_M / 1000} km
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Explore premium venues in your vicinity.</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search destinations…"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
      </View>

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
            <VenueCard place={item} userLocation={userLocation} onPress={() => openMap(item)} />
          )}
          // One section on its own is just "the list" — a header would be noise.
          renderSectionHeader={({ section }) =>
            sections.length > 1 ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
          }
          ListFooterComponent={<SearchStatus {...searchStatus} />}
          ListEmptyComponent={
            !loading && !remoteLoading ? (
              <Text style={styles.emptyText}>
                {search.trim()
                  ? `Nothing found for “${search.trim()}”.`
                  : "No places found nearby."}
              </Text>
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

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.headline} />
              </Pressable>
            </View>

            <View style={styles.filterOption}>
              <View style={styles.filterLeft}>
                <Text style={styles.filterLabel}>Show Open First</Text>
                <Text style={styles.filterDescription}>Sort open venues by distance</Text>
              </View>
              <Switch
                value={sortByOpenFirst}
                onValueChange={setSortByOpenFirst}
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={sortByOpenFirst ? colors.primary : colors.muted}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

/** Coordinates, not list position — stable across re-sorts and across sections. */
const placeKey = (p: NearbyPlace) => `${p.name}-${p.lat}-${p.lng}`;

const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  topBarTitle: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sortBtn: {
    padding: 8,
  },
  sortBtnActive: {
    opacity: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 32,
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  countText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 0.5,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 10,
  },
  errorBanner: {
    marginHorizontal: 20,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  filterLeft: {
    flex: 1,
  },
  filterLabel: {
    color: colors.headline,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    marginBottom: 4,
  },
  filterDescription: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
}));
