import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import { useToast } from "../../components/Toast";
import {
  BackButton,
  Card,
  MutedText,
  PageTitle,
  PrimaryButton,
  SearchField,
  SectionLabel,
} from "../../components/ui";
import { favouriteKey, useFavourites, type FavouriteInput } from "../../favourites";
import { useAction } from "../../hooks/useAction";
import { MIN_QUERY_LENGTH, useTextSearch } from "../../hooks/useTextSearch";
import { useLocation } from "../../location";
import type { FriendsStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme";
import { CATEGORY_LABELS } from "../../types";
import { formatDistance, haversineDistance } from "../../utils/geo";
import { useStyles } from "./styles";

type Place = Pick<FavouriteInput, "name" | "lat" | "lng" | "vicinity" | "category">;

/** Adds places to a group's crawl, from a search or the caller's favourites. */
export const AddCrawlStopScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<FriendsStackParamList, "AddCrawlStop">>();
  const { groupId } = params;
  const group = useQuery(api.groups.get, { groupId });
  const crawl = useQuery(api.crawl.get, { groupId });
  const addStop = useMutation(api.crawl.addStop);
  const { origin } = useLocation();
  const { favourites } = useFavourites();
  const [query, setQuery] = useState("");
  const search = useTextSearch(query, origin, true);
  const { run, busy } = useAction();

  const onCrawl = new Set(crawl?.stops.map((s) => favouriteKey(s)));
  const searching = query.trim().length >= MIN_QUERY_LENGTH;
  const places: Place[] = searching ? search.results : favourites;

  const add = (place: Place) =>
    void run(async () => {
      await addStop({
        groupId,
        place: {
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          vicinity: place.vicinity,
          category: place.category,
        },
      });
      toast.show(`Added ${place.name}.`, "success");
    }, "Couldn't add that stop. Check your connection.");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <BackButton label={group?.name ?? "Group"} />
      <PageTitle
        style={styles.pageTitle}
        title="Add stops"
        subtitle={crawl ? `${crawl.stops.length} on the crawl so far` : undefined}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <SearchField
          style={styles.nameField}
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
          placeholder="Search for a pub or bar"
          returnKeyType="search"
        />

        <SectionLabel>{searching ? "Results" : "Your favourites"}</SectionLabel>
        {searching && search.loading && places.length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : searching && search.error ? (
          <MutedText style={styles.gone}>{search.error}</MutedText>
        ) : places.length === 0 ? (
          <MutedText style={styles.gone}>
            {searching
              ? "Nothing found. Try another name."
              : "Star places in Browse to find them here, or search above."}
          </MutedText>
        ) : (
          places.map((p) => {
            const key = favouriteKey(p);
            const added = onCrawl.has(key);
            const distance = origin
              ? haversineDistance(origin.lat, origin.lng, p.lat, p.lng)
              : null;
            return (
              <Card
                key={key}
                style={styles.pickRow}
                selected={added}
                onPress={added || busy ? undefined : () => add(p)}
                accessibilityRole="button"
                accessibilityState={{ disabled: added || busy }}
                accessibilityLabel={added ? `${p.name}, already on the crawl` : `Add ${p.name}`}
              >
                <View style={styles.pickName}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.memberMeta} numberOfLines={1}>
                    {p.category !== "other" ? `${CATEGORY_LABELS[p.category]} · ` : ""}
                    {distance != null ? `${formatDistance(distance)} · ` : ""}
                    {p.vicinity}
                  </Text>
                </View>
                <Ionicons
                  name={added ? "checkmark-circle" : "add-circle-outline"}
                  size={22}
                  color={added ? colors.primary : colors.muted}
                />
              </Card>
            );
          })
        )}
      </ScrollView>
      <View style={styles.submit}>
        <PrimaryButton
          title={`Done · ${crawl?.stops.length ?? 0} stops`}
          onPress={() => navigation.goBack()}
          busy={busy}
        />
      </View>
    </SafeAreaView>
  );
};
