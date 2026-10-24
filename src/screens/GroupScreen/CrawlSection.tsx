import { Ionicons } from "@expo/vector-icons";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Crawl, CrawlStop } from "../../../convex/crawl";
import type { Group } from "../../../convex/groups";
import { Card, PrimaryButton, SectionLabel } from "../../components/ui";
import { CrawlMap } from "./CrawlMap";
import { crawlProgress } from "../../crawl";
import { toFavourite } from "../../favourites";
import { useAction } from "../../hooks/useAction";
import { useLocation } from "../../location";
import type { FriendsStackParamList, TabParamList } from "../../navigation/types";
import { fonts, makeStyles, useTheme } from "../../theme";
import { CATEGORY_LABELS, isPlaceCategory } from "../../types";
import { formatDistance, formatWalkTime, haversineDistance } from "../../utils/geo";

type Nav = NavigationProp<FriendsStackParamList & TabParamList>;

const FAILED = "Couldn't update the crawl. Check your connection.";

const describeStop = (stop: CrawlStop) =>
  isPlaceCategory(stop.category)
    ? `${CATEGORY_LABELS[stop.category]}${stop.vicinity ? ` · ${stop.vicinity}` : ""}`
    : stop.vicinity;

const useCompass = () => {
  const navigation = useNavigation<Nav>();
  return (stop: CrawlStop) =>
    navigation.navigate("Compass", {
      screen: "CompassHome",
      params: {
        target: toFavourite({
          ...stop,
          category: isPlaceCategory(stop.category) ? stop.category : "other",
        }),
      },
    });
};

const Summary: React.FC<{ group: Group; crawl: Crawl }> = ({ group, crawl }) => {
  const styles = useStyles();
  const { realLocation } = useLocation();
  const compass = useCompass();
  const setCurrent = useMutation(api.crawl.setCurrent);
  const finish = useMutation(api.crawl.finish);
  const { run, busy } = useAction();
  const { stops, currentIndex, completed } = crawl;
  const current = currentIndex == null ? null : stops[currentIndex];
  const next = stops[currentIndex == null ? 0 : currentIndex + 1];
  const fromYou =
    next && realLocation
      ? haversineDistance(realLocation.lat, realLocation.lng, next.lat, next.lng)
      : null;
  const restart = () =>
    Alert.alert(
      "Restart the crawl?",
      "The route stays. Everyone's progress returns to the start.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          onPress: () =>
            void run(() => setCurrent({ groupId: group.groupId, stopId: null }), FAILED),
        },
      ],
    );

  return (
    <Card style={styles.summary} selected={!!current && !completed}>
      <Text style={styles.summaryMeta}>
        {completed
          ? "CRAWL COMPLETE"
          : current
            ? `GROUP'S AT · STOP ${currentIndex! + 1} OF ${stops.length}`
            : "FIRST STOP"}
      </Text>
      <Text style={styles.summaryTitle}>
        {completed ? "That's a wrap!" : (current?.name ?? next?.name)}
      </Text>
      <Text style={styles.summaryMeta}>
        {completed
          ? "The route is saved for your next night out."
          : current
            ? describeStop(current)
            : "Open the compass to get there, then mark the group's arrival."}
      </Text>
      {completed ? (
        <Pressable
          style={styles.endButton}
          accessibilityRole="button"
          disabled={busy}
          onPress={restart}
        >
          <Text style={styles.endButtonText}>Restart crawl</Text>
        </Pressable>
      ) : next ? (
        <>
          {current && (
            <>
              <Text style={styles.nextLabel}>UP NEXT</Text>
              <Text style={styles.nextName}>{next.name}</Text>
            </>
          )}
          {fromYou != null && (
            <Text style={styles.summaryMeta}>
              {formatDistance(fromYou)} from you · straight-line estimate
            </Text>
          )}
          <Pressable
            style={styles.endButton}
            accessibilityRole="button"
            onPress={() => compass(next)}
          >
            <Text style={styles.endButtonText}>Open compass</Text>
          </Pressable>
          <PrimaryButton
            title="We've arrived"
            busy={busy}
            onPress={() =>
              void run(() => setCurrent({ groupId: group.groupId, stopId: next.stopId }), FAILED)
            }
          />
          <Text style={styles.summaryMeta}>Arrival updates the crawl for everyone.</Text>
        </>
      ) : (
        <>
          <Text style={styles.nextName}>Final stop — enjoy!</Text>
          <PrimaryButton
            title="Finish crawl"
            busy={busy}
            onPress={() => void run(() => finish({ groupId: group.groupId }), FAILED)}
          />
        </>
      )}
    </Card>
  );
};

type StopRowProps = {
  group: Group;
  crawl: Crawl;
  index: number;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
};

const StopRow: React.FC<StopRowProps> = ({ group, crawl, index, open, onToggle, editing }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const compass = useCompass();
  const setCurrent = useMutation(api.crawl.setCurrent);
  const moveStop = useMutation(api.crawl.moveStop);
  const removeStop = useMutation(api.crawl.removeStop);
  const { run, busy } = useAction();
  const stop = crawl.stops[index]!;
  const { currentIndex } = crawl;
  const here = currentIndex === index;
  const done = crawl.completed || (currentIndex != null && index < currentIndex);
  const last = index === crawl.stops.length - 1;

  const pointCompass = () => compass(stop);

  const remove = () =>
    Alert.alert(`Remove ${stop.name}?`, `It comes off ${group.name}'s crawl for everyone.`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void run(() => removeStop({ stopId: stop.stopId }), FAILED),
      },
    ]);

  const actions: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    ...(here || crawl.completed
      ? []
      : [
          {
            label: "We're here",
            icon: "flag-outline" as const,
            onPress: () =>
              void run(() => setCurrent({ groupId: group.groupId, stopId: stop.stopId }), FAILED),
          },
        ]),
    { label: "Compass", icon: "compass-outline", onPress: pointCompass },
    ...(editing && index > 0
      ? [
          {
            label: "Earlier",
            icon: "arrow-up" as const,
            onPress: () => void run(() => moveStop({ stopId: stop.stopId, by: -1 }), FAILED),
          },
        ]
      : []),
    ...(!editing || last
      ? []
      : [
          {
            label: "Later",
            icon: "arrow-down" as const,
            onPress: () => void run(() => moveStop({ stopId: stop.stopId, by: 1 }), FAILED),
          },
        ]),
    ...(editing ? [{ label: "Remove", icon: "trash-outline" as const, onPress: remove }] : []),
  ];

  const state = done ? "visited" : here ? "group is here" : "upcoming";

  return (
    <Card
      style={[styles.stop, done && styles.stopDone]}
      selected={here && !crawl.completed}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`Stop ${index + 1}, ${stop.name}, ${state}`}
    >
      <View style={styles.stopBody}>
        <View style={styles.stopHead}>
          <View style={[styles.badge, here && styles.badgeHere, done && styles.badgeDone]}>
            {done ? (
              <Ionicons name="checkmark" size={14} color={colors.background} />
            ) : (
              <Text style={[styles.badgeText, here && styles.badgeTextHere]}>{index + 1}</Text>
            )}
          </View>
          <View style={styles.stopText}>
            <Text style={styles.stopName} numberOfLines={1}>
              {stop.name}
            </Text>
            <Text style={styles.stopMeta} numberOfLines={1}>
              {done ? "Visited · " : here ? "Group’s here · " : ""}
              {describeStop(stop)}
            </Text>
          </View>
          {busy ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
          )}
        </View>
        {open && (
          <View style={styles.actions}>
            {actions.map((a) => (
              <Pressable
                key={a.label}
                style={styles.action}
                onPress={a.onPress}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${a.label}: ${stop.name}`}
              >
                <Ionicons name={a.icon} size={14} color={colors.primary} />
                <Text style={styles.actionText}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Card>
  );
};

export const CrawlSection: React.FC<{ group: Group }> = ({ group }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const crawl = useQuery(api.crawl.get, { groupId: group.groupId });
  const [openStop, setOpenStop] = useState<CrawlStop["stopId"] | null>(null);

  const [editing, setEditing] = useState(false);

  if (crawl === undefined) return <ActivityIndicator color={colors.primary} />;
  if (crawl === null) return null;
  const { legs } = crawlProgress(crawl.stops, crawl.currentIndex);

  return (
    <>
      <SectionLabel style={styles.label}>
        Pub crawl{crawl.stops.length > 0 ? ` · ${crawl.stops.length} stops` : ""}
      </SectionLabel>

      {crawl.stops.length === 0 ? (
        <Text style={styles.intro}>
          Plan a route: add the places you're heading to, in order. Everyone here sees it and can
          mark where you're at.
        </Text>
      ) : (
        <>
          <Summary group={group} crawl={crawl} />
          <CrawlMap crawl={crawl} selectedId={openStop} onSelect={setOpenStop} />
          <View style={styles.routeHeader}>
            <SectionLabel>The route</SectionLabel>
            <Pressable
              style={styles.editButton}
              accessibilityRole="button"
              onPress={() => setEditing((value) => !value)}
            >
              <Text style={styles.actionText}>{editing ? "Done editing" : "Edit route"}</Text>
            </Pressable>
          </View>
          {crawl.stops.map((s, i) => (
            <React.Fragment key={s.stopId}>
              <StopRow
                editing={editing}
                group={group}
                crawl={crawl}
                index={i}
                open={openStop === s.stopId}
                onToggle={() => setOpenStop((prev) => (prev === s.stopId ? null : s.stopId))}
              />
              {legs[i] != null && (
                <View style={styles.leg}>
                  <Ionicons name="walk-outline" size={13} color={colors.muted} />
                  <Text style={styles.legText}>
                    {formatDistance(legs[i])} · ~{formatWalkTime(legs[i])} straight-line
                  </Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </>
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate("AddCrawlStop", { groupId: group.groupId })}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={styles.addButtonText}>Add stops</Text>
      </Pressable>
    </>
  );
};

const useStyles = makeStyles((colors) => ({
  routeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  editButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  nextLabel: { color: colors.muted, fontFamily: fonts.labelBold, fontSize: 11, marginTop: 12 },
  nextName: { color: colors.headline, fontFamily: fonts.headlineSemi, fontSize: 18 },
  label: {
    marginTop: 24,
  },
  intro: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  summary: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 14,
  },
  summaryTitle: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
  },
  summaryMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  endButton: {
    minHeight: 44,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  endButtonText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stop: {
    alignItems: "flex-start",
  },
  stopDone: {
    opacity: 0.6,
  },
  stopBody: {
    flex: 1,
    gap: 12,
  },
  stopHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeHere: {
    backgroundColor: colors.primary,
  },
  badgeDone: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
  },
  badgeTextHere: {
    color: colors.background,
  },
  stopText: {
    flex: 1,
  },
  stopName: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 16,
  },
  stopMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 44,
    borderRadius: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  leg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 27,
    paddingLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingVertical: 6,
  },
  legText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    minHeight: 44,
    borderRadius: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 10,
  },
  addButtonText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
}));
