import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "convex/react";
import React, { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ConnectionKind } from "../../../convex/social";
import { CONNECTIONS_LIMIT } from "../../../convex/lib/limits";
import type { ProfileView } from "../../../convex/profiles";
import { Avatar, BackButton, MutedText, SectionLabel } from "../../components/ui";
import { type FavouriteInput, toFavourite, useFavourites } from "../../favourites";
import { PlaceRow } from "../../favourites/PlaceRow";
import { useLocation } from "../../location";
import type { ProfileStackParamList, TabParamList } from "../../navigation/types";
import { useTheme } from "../../theme";
import { isPlaceCategory } from "../../types";
import { FollowButton, FollowRequestCard, useBlock } from "../../social";
import { LocationControls } from "../../sharing";
import { ProfileActions } from "./ProfileActions";
import { useStyles } from "./styles";

const STATS: { kind: ConnectionKind; label: string }[] = [
  { kind: "friends", label: "Friends" },
  { kind: "following", label: "Following" },
  { kind: "followers", label: "Followers" },
];

const toPlace = (f: NonNullable<ProfileView["favourites"]>[number]): FavouriteInput => ({
  name: f.name,
  lat: f.lat,
  lng: f.lng,
  vicinity: f.vicinity,
  category: isPlaceCategory(f.category) ? f.category : "other",
});

const hiddenFavouritesText = (profile: ProfileView): string =>
  profile.youFollow && profile.followsYou
    ? `${profile.displayName} keeps their favourites private.`
    : `Become friends with ${profile.displayName} to see their favourite spots.`;

type FooterLinkProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
};

const FooterLink: React.FC<FooterLinkProps> = ({ icon, label, accessibilityLabel, ...rest }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      style={styles.footerLink}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      {...rest}
    >
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={styles.footerLinkText}>{label}</Text>
    </Pressable>
  );
};

type BlockProps = { userId: Id<"users">; displayName: string };

const BlockedNotice: React.FC<BlockProps> = ({ userId, displayName }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { unblock, busy } = useBlock(userId, displayName);
  return (
    <View style={styles.blocked}>
      <Text style={styles.blockedText}>
        You've blocked {displayName}. They can't find your profile or follow you.
      </Text>
      <Pressable
        style={styles.editButton}
        onPress={() => void unblock()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Unblock ${displayName}`}
        accessibilityState={{ busy }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.editButtonText}>Unblock</Text>
        )}
      </Pressable>
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const route = useRoute<RouteProp<ProfileStackParamList, "Profile">>();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { userId } = route.params;
  const profile = useQuery(api.profiles.view, { userId });
  const { favourites: mine, isFavourite, toggleFavourite } = useFavourites();
  const { origin } = useLocation();

  // Your own list comes from the device, which is ahead of the synced copy.
  const places: FavouriteInput[] | null = profile?.isYou
    ? mine
    : (profile?.favourites?.map(toPlace) ?? null);

  const pointAt = useCallback(
    (place: FavouriteInput) =>
      navigation.getParent<NavigationProp<TabParamList>>()?.navigate("Compass", {
        screen: "CompassHome",
        params: { target: toFavourite(place) },
      }),
    [navigation],
  );

  if (profile === undefined) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <BackButton label="Back" />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (profile === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <BackButton label="Back" />
        <MutedText>This account no longer exists.</MutedText>
      </SafeAreaView>
    );
  }

  const friends = profile.youFollow && profile.followsYou;
  const count = (n: number) =>
    profile.countsCapped && n >= CONNECTIONS_LIMIT ? `${CONNECTIONS_LIMIT}+` : String(n);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <BackButton
        label="Back"
        accessory={
          !profile.isYou && (
            <ProfileActions
              userId={userId}
              username={profile.username}
              displayName={profile.displayName}
              youBlocked={profile.youBlocked}
            />
          )
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={profile.displayName} uri={profile.avatarUrl} size={72} />
          <View style={styles.headerText}>
            <Text style={styles.name} accessibilityRole="header" numberOfLines={2}>
              {profile.displayName}
            </Text>
            <Text style={styles.username}>
              @{profile.username}
              {profile.followsYou && !profile.youFollow ? " · Follows you" : ""}
            </Text>
          </View>
        </View>

        {profile.youBlocked ? (
          <BlockedNotice userId={userId} displayName={profile.displayName} />
        ) : (
          <>
            {profile.bio !== "" && <Text style={styles.bio}>{profile.bio}</Text>}

            <View style={styles.stats}>
              {STATS.map(({ kind, label }) => (
                <Pressable
                  key={kind}
                  style={styles.stat}
                  onPress={() =>
                    navigation.push("Connections", { userId, kind, name: profile.displayName })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${count(profile.counts[kind])} ${label}`}
                >
                  <Text style={styles.statValue}>{count(profile.counts[kind])}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {profile.requestedYou && (
              <View style={styles.request}>
                <FollowRequestCard person={profile} />
              </View>
            )}

            <View style={styles.actions}>
              {profile.isYou ? (
                <Pressable
                  style={styles.editButton}
                  onPress={() => navigation.push("EditProfile")}
                  accessibilityRole="button"
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.editButtonText}>Edit profile</Text>
                </Pressable>
              ) : (
                <FollowButton person={profile} />
              )}
              {friends && <LocationControls person={profile} />}
            </View>

            <SectionLabel style={styles.sectionLabel}>
              Favourite spots{places && places.length > 0 ? ` · ${places.length}` : ""}
            </SectionLabel>
            {places === null ? (
              <MutedText style={styles.emptyText}>{hiddenFavouritesText(profile)}</MutedText>
            ) : places.length === 0 ? (
              <MutedText style={styles.emptyText}>
                {profile.isYou
                  ? "Star places on the Compass tab's Favourites screen and they'll show up here for your friends."
                  : "No favourites yet."}
              </MutedText>
            ) : (
              places.map((place) => (
                <PlaceRow
                  key={`${place.lat},${place.lng}`}
                  place={place}
                  userLocation={origin}
                  favourite={isFavourite(place)}
                  onToggle={() => toggleFavourite(place)}
                  onPress={() => pointAt(place)}
                />
              ))
            )}
            {profile.isYou && profile.showFavourites === false && (
              <MutedText style={styles.emptyText}>
                Only you can see these. Turn on sharing in Edit profile to show them to friends.
              </MutedText>
            )}
          </>
        )}

        {profile.isYou && (
          <View style={styles.footer}>
            <FooterLink
              icon="ban-outline"
              label="Blocked accounts"
              onPress={() => navigation.push("Blocked")}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
