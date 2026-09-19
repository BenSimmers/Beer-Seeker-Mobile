import React, { useMemo, useState } from "react";
import { Modal, Pressable, RefreshControl, SectionList, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CategoryChips } from "../components/CategoryChips";
import { ErrorBanner } from "../components/common";
import { callStore, openInMaps } from "../components/StoreCard";
import { StoreMapModal } from "../components/StoreMapModal";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { MIN_QUERY_LENGTH, useTextSearch } from "../hooks/useTextSearch";
import { CATEGORY_LABELS } from "../types";
import type { CategoryFilter, NearbyPlace, UserLocation } from "../types";
import { SEARCH_RADIUS_M } from "../config";
import { fonts, makeStyles, useTheme } from "../theme";
import { bearingToCardinal, calculateBearing, formatDistance, formatWalkTime } from "../utils/geo";

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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
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

type SearchStatusProps = {
  loading: boolean;
  error: string | null;
  hint: boolean;
  query: string;
};

const SearchStatus: React.FC<SearchStatusProps> = ({ loading, error, hint, query }) => {
  const styles = useStyles();

  if (loading) return <Text style={styles.searchStatus}>Searching further afield…</Text>;
  if (error) return <Text style={styles.searchStatus}>{error}</Text>;
  if (hint && query.length < MIN_QUERY_LENGTH) {
    return (
      <Text style={styles.searchStatus}>
        Type at least {MIN_QUERY_LENGTH} characters to search beyond {SEARCH_RADIUS_M / 1000} km.
      </Text>
    );
  }
  return null;
};

type VenueCardProps = {
  place: NearbyPlace;
  userLocation: UserLocation | null;
  onPress: () => void;
};

const VenueCard: React.FC<VenueCardProps> = ({ place, userLocation, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { phone, rating, openNow } = place;

  // Absolute bearing, the same figure the compass needle points at — it only
  // means anything once we know where the user is standing.
  const bearing = userLocation
    ? calculateBearing(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <View style={styles.metaRow}>
            {place.category !== "other" && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{CATEGORY_LABELS[place.category]}</Text>
              </View>
            )}
            {openNow != null && (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, !openNow && styles.statusDotClosed]} />
                <Text style={[styles.statusText, !openNow && styles.statusTextClosed]}>
                  {openNow ? "Open now" : "Closed"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {place.name}
            </Text>
            {rating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.secondary} />
            <Text style={styles.address} numberOfLines={1}>
              {place.vicinity}
            </Text>
            <Text style={styles.walkTime}>• {formatWalkTime(place.distance)}</Text>
          </View>
        </View>

        <View style={styles.distanceCol}>
          <View style={styles.distancePill}>
            <Ionicons name="navigate" size={13} color={colors.primary} />
            <Text style={styles.distanceText}>{formatDistance(place.distance)}</Text>
          </View>
          {bearing != null && (
            <Text style={styles.bearingText}>
              {bearingToCardinal(bearing)} {Math.round(bearing)}°
            </Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          {phone && (
            <Pressable style={styles.actionBtn} onPress={() => callStore(phone)}>
              <Ionicons name="call-outline" size={13} color={colors.primary} />
              <Text style={styles.actionBtnText}>Call</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.guideBtn} onPress={() => openInMaps(place)}>
          <Text style={styles.guideBtnText}>Guide</Text>
          <Ionicons name="navigate-outline" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </Pressable>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardMain: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusDotClosed: {
    backgroundColor: colors.muted,
  },
  statusText: {
    color: colors.body,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  statusTextClosed: {
    color: colors.muted,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  address: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    flexShrink: 1,
  },
  walkTime: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 11,
  },
  distanceCol: {
    alignItems: "flex-end",
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  distanceText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 14,
  },
  bearingText: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  guideBtnText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
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
  searchStatus: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
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
