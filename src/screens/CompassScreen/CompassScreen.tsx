import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryChips } from "../../components/CategoryChips";
import { Compass } from "../../components/Compass";
import { LocationHeader } from "../../components/LocationHeader";
import { useToast } from "../../components/Toast";
import { StoreCard } from "../../components/StoreCard";
import { StoreMap } from "../../components/StoreMap";
import { StoreMapModal } from "../../components/StoreMapModal";
import { favouriteStoreProvider } from "../../favourites";
import { useCompass } from "../../hooks/useCompass";
import { nearestPlaceProvider } from "../../api/googlePlaces";
import type { CompassStackParamList } from "../../navigation/types";
import type { CategoryFilter } from "../../types";
import { PinnedPill } from "./PinnedPill";
import { useStyles } from "./styles";

export const CompassScreen: React.FC = () => {
  const styles = useStyles();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<CompassStackParamList>>();
  const route = useRoute<RouteProp<CompassStackParamList, "CompassHome">>();
  const [mapExpanded, setMapExpanded] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>("liquor_store");

  // The route param *is* the pin: the Favourites screen sets it on the way back
  // here, and clearing it is what un-pins. No local copy to keep in step.
  const pinned = route.params?.target ?? null;
  const clearPin = useCallback(() => navigation.setParams({ target: undefined }), [navigation]);

  // A pinned place answers the question the category chips ask, so it replaces
  // the nearest-match search outright rather than filtering it.
  const provider = useMemo(
    () => (pinned ? favouriteStoreProvider(pinned) : nearestPlaceProvider(filter)),
    [pinned, filter],
  );
  const { userLocation, needleAngle, dialAngle, store, error, loading, refresh } =
    useCompass(provider);

  const selectFilter = useCallback(
    (next: CategoryFilter) => {
      // Picking a category is asking "what's nearest?" again — the pin is done.
      clearPin();
      setFilter(next);
    },
    [clearPin],
  );

  // Toast each error once per provider: switching category or pin is a fresh
  // question, so the same message is worth showing again.
  const shownError = useRef<{ provider: typeof provider; error: string } | null>(null);
  useEffect(() => {
    if (!error) return;
    const shown = shownError.current;
    if (shown?.provider === provider && shown.error === error) return;
    toast.show(error, "error");
    shownError.current = { provider, error };
  }, [error, provider, toast]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LocationHeader location={userLocation} />
      <View style={styles.chipsContainer}>
        <CategoryChips
          value={pinned ? null : filter}
          onChange={selectFilter}
          contentPadding={20}
          scrollable
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pinned && <PinnedPill name={pinned.name} onClear={clearPin} />}

        <View style={styles.compassContainer}>
          <Compass
            needleAngle={needleAngle}
            dialAngle={dialAngle}
            store={store}
            userLocation={userLocation}
            loading={loading}
            onPress={loading || !userLocation ? undefined : refresh}
          />
        </View>

        {store && userLocation && (
          <Pressable onPress={() => setMapExpanded(true)} style={styles.mapThumb}>
            <StoreMap
              store={store}
              userLocation={userLocation}
              dimmed={loading}
              variant="thumbnail"
            />
          </Pressable>
        )}

        {store && <StoreCard store={store} dimmed={loading} userLocation={userLocation} />}
      </ScrollView>

      <StoreMapModal
        store={store}
        userLocation={userLocation}
        visible={mapExpanded}
        onClose={() => setMapExpanded(false)}
      />
    </SafeAreaView>
  );
};
