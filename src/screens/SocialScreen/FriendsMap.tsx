import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Person } from "../../../convex/social";
import { Avatar, MutedText } from "../../components/ui";
import { useDarkMapStyle } from "../../components/StoreMap";
import { useLocation } from "../../location";
import type { FriendsStackParamList } from "../../navigation/types";
import { describeFix, LocationControls, timeLeft, useNow } from "../../sharing";
import { fonts, makeStyles, useTheme } from "../../theme";
import { MIN_DELTA } from "../../utils/mapRegion";
import { GroupChips } from "./GroupChips";
import { PersonRow } from "../../social";
import { useOpenProfile } from "../../navigation/useOpenProfile";

type Share = FunctionReturnType<typeof api.location.sharedWithMe>[number];
type Position = NonNullable<Share["position"]>;
type Pin = { friend: Person; position: Position };

const LABEL_REFRESH_MS = 15_000;
const FIT_PADDING = { top: 60, right: 60, bottom: 60, left: 60 };
const FOCUS_DELTA = MIN_DELTA * 2;
const MARKER_SIZE = 36;

type Point = { lat: number; lng: number };

const toLatLng = (p: Point) => ({ latitude: p.lat, longitude: p.lng });

const regionAround = (p: Point) => ({
  ...toLatLng(p),
  latitudeDelta: FOCUS_DELTA,
  longitudeDelta: FOCUS_DELTA,
});

const focus = (map: MapView | null, p: Point) => map?.animateToRegion(regionAround(p), 400);

/** Frames every sharing friend plus you; a lone point gets a street-level zoom. */
const fitTo = (map: MapView | null, pins: Pin[], me: Point | null) => {
  const points: Point[] = pins.map((p) => p.position);
  if (me) points.push(me);
  const [first] = points;
  if (points.length > 1) {
    map?.fitToCoordinates(points.map(toLatLng), { edgePadding: FIT_PADDING, animated: true });
  } else if (first) {
    focus(map, first);
  }
};

/**
 * Friends on a map: anyone sharing with you shows up as a pin. The strip
 * underneath lists every friend so you can still share with ones who aren't.
 * Group chips on top narrow both down to one group's members.
 */
export const FriendsMap: React.FC<{ friends: Person[] }> = ({ friends }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const darkMapStyle = useDarkMapStyle();
  const openProfile = useOpenProfile();
  const { realLocation } = useLocation();
  const shared = useQuery(api.location.sharedWithMe);
  const now = useNow(LABEL_REFRESH_MS);
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<FriendsStackParamList>>();
  const groups = useQuery(api.groups.mine);
  const [groupId, setGroupId] = useState<Id<"groups"> | null>(null);
  const group = groups?.find((g) => g.groupId === groupId) ?? null;
  const shown = useMemo(() => {
    if (!group) return friends;
    const members = new Set(
      group.members.filter((m) => m.status === "member").map((m) => m.userId),
    );
    return friends.filter((f) => members.has(f.userId));
  }, [friends, group]);

  const shares = useMemo(() => new Map((shared ?? []).map((s) => [s.userId, s])), [shared]);
  const pins = useMemo<Pin[]>(
    () =>
      shown.flatMap((friend) => {
        const position = shares.get(friend.userId)?.position;
        return position ? [{ friend, position }] : [];
      }),
    [shown, shares],
  );
  const selected = shown.find((f) => f.userId === selectedId) ?? null;

  // Fit everyone in view when someone starts or stops sharing, not on every
  // position update — that would yank the map while you're panning it.
  const fitKey = `${pins.map((p) => p.friend.userId).join(",")}|${realLocation ? "me" : ""}`;
  const fittedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!mapReady || fitKey === fittedKey.current) return;
    fittedKey.current = fitKey;
    fitTo(mapRef.current, pins, realLocation);
  }, [mapReady, fitKey, pins, realLocation]);

  const select = (userId: Id<"users">) => {
    if (userId === selectedId) {
      setSelectedId(null);
      return fitTo(mapRef.current, pins, realLocation);
    }
    setSelectedId(userId);
    const position = shares.get(userId)?.position;
    if (position) focus(mapRef.current, position);
  };

  const initialCentre = realLocation ?? pins[0]?.position;

  return (
    <View>
      {groups !== undefined && (
        <GroupChips
          groups={groups}
          selected={groupId}
          onSelect={setGroupId}
          onNew={() => navigation.push("PickGroupMembers")}
        />
      )}
      {group && (
        <Pressable
          style={styles.groupBar}
          onPress={() => navigation.push("Group", { groupId: group.groupId })}
          accessibilityRole="button"
          accessibilityLabel={`Manage ${group.name}`}
        >
          <Text style={styles.groupBarText} numberOfLines={1}>
            {shown.length} {shown.length === 1 ? "friend" : "friends"} in {group.name}
          </Text>
          <Text style={styles.groupBarAction}>Manage</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      )}
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialCentre ? regionAround(initialCentre) : undefined}
          onMapReady={() => setMapReady(true)}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          userInterfaceStyle="dark"
          customMapStyle={Platform.OS === "android" ? darkMapStyle : undefined}
        >
          {pins.map(({ friend, position }) => {
            const fix = describeFix(position, now);
            const isSelected = friend.userId === selectedId;
            return (
              <React.Fragment key={friend.userId}>
                {fix.warning === "imprecise" && position.accuracy !== null && (
                  <Circle
                    center={toLatLng(position)}
                    radius={position.accuracy}
                    strokeColor={colors.primary}
                    fillColor={colors.primaryMuted}
                  />
                )}
                <Marker
                  coordinate={toLatLng(position)}
                  onPress={() => select(friend.userId)}
                  anchor={{ x: 0.5, y: 0.5 }}
                  zIndex={isSelected ? 2 : 1}
                  accessibilityLabel={`${friend.displayName}, ${fix.label.toLowerCase()}`}
                >
                  <View
                    style={[
                      styles.pin,
                      fix.warning === "stale" && styles.pinStale,
                      isSelected && styles.pinSelected,
                    ]}
                  >
                    <Avatar name={friend.displayName} uri={friend.avatarUrl} size={MARKER_SIZE} />
                  </View>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapView>

        <View style={styles.badge} pointerEvents="none">
          <View style={[styles.liveDot, pins.length === 0 && styles.liveDotOff]} />
          <Text style={styles.badgeText}>
            {shared === undefined
              ? "Loading…"
              : pins.length === 0
                ? "No one's sharing with you"
                : `${pins.length} sharing with you`}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {shown.map((friend) => {
          const isSelected = friend.userId === selectedId;
          const live = shares.get(friend.userId)?.position != null;
          return (
            <Pressable
              key={friend.userId}
              style={styles.chip}
              onPress={() => select(friend.userId)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${friend.displayName}${live ? ", sharing their location" : ""}`}
            >
              <View style={[styles.chipAvatar, isSelected && styles.chipAvatarSelected]}>
                <Avatar name={friend.displayName} uri={friend.avatarUrl} size={48} />
                {live && <View style={[styles.liveDot, styles.chipDot]} />}
              </View>
              <Text
                style={[styles.chipName, isSelected && styles.chipNameSelected]}
                numberOfLines={1}
              >
                {friend.displayName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selected ? (
        <PersonRow person={selected} onPress={() => openProfile(selected.userId)}>
          <ShareStatus share={shares.get(selected.userId)} now={now} />
          <LocationControls person={selected} />
        </PersonRow>
      ) : (
        <MutedText style={styles.hint}>
          {group && shown.length === 0
            ? `None of your friends have joined ${group.name} yet.`
            : "Tap a friend to see where they are or share your location with them."}
        </MutedText>
      )}
    </View>
  );
};

const ShareStatus: React.FC<{ share: Share | undefined; now: number }> = ({ share, now }) => {
  const styles = useStyles();
  if (!share) return <Text style={styles.status}>Not sharing their location with you</Text>;
  const left = timeLeft(share.expiresAt, now);
  if (!share.position) {
    return <Text style={styles.status}>Sharing · waiting for their phone · {left}</Text>;
  }
  const fix = describeFix(share.position, now);
  return (
    <Text style={[styles.status, fix.warning !== null && styles.statusWarning]}>
      {[fix.label, fix.accuracyLabel, left].filter(Boolean).join(" · ")}
    </Text>
  );
};

const useStyles = makeStyles((colors) => ({
  groupBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  groupBarText: {
    flex: 1,
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  groupBarAction: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  mapCard: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  pin: {
    borderRadius: MARKER_SIZE,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  pinStale: {
    borderColor: colors.muted,
    opacity: 0.6,
  },
  pinSelected: {
    borderWidth: 3,
    borderColor: colors.headline,
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background + "dd",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveDotOff: {
    backgroundColor: colors.muted,
  },
  strip: {
    gap: 14,
    paddingVertical: 14,
  },
  chip: {
    width: 64,
    alignItems: "center",
    gap: 6,
  },
  chipAvatar: {
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 2,
  },
  chipAvatarSelected: {
    borderColor: colors.primary,
  },
  chipDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  chipName: {
    color: colors.body,
    fontFamily: fonts.label,
    fontSize: 11,
    maxWidth: 64,
  },
  chipNameSelected: {
    color: colors.headline,
  },
  hint: {
    marginTop: 0,
    textAlign: "left",
  },
  status: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  statusWarning: {
    color: colors.danger,
  },
}));
