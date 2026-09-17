import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryChips } from "../components/CategoryChips";
import { Compass } from "../components/Compass";
import { LocationHeader } from "../components/LocationHeader";
import { useToast } from "../components/Toast";
import { StoreCard } from "../components/StoreCard";
import { StoreMap } from "../components/StoreMap";
import { StoreMapModal } from "../components/StoreMapModal";
import { useCompass } from "../hooks/useCompass";
import { nearestPlaceProvider } from "../api/googlePlaces";
import type { CategoryFilter } from "../types";
import { fonts, makeStyles } from "../theme";

export const CompassScreen: React.FC = () => {
  const styles = useStyles();
  const toast = useToast();
  const [mapExpanded, setMapExpanded] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>("liquor_store");
  const [lastShownError, setLastShownError] = useState<string | null>(null);
  const provider = useMemo(() => nearestPlaceProvider(filter), [filter]);
  const { userLocation, needleAngle, dialAngle, store, error, loading, refresh } =
    useCompass(provider);

  useEffect(() => {
    setLastShownError(null);
  }, [filter]);

  useEffect(() => {
    if (error && error !== lastShownError) {
      toast.show(error, "error");
      setLastShownError(error);
    }
  }, [error, lastShownError, toast]);

  const statusText = useMemo(() => {
    if (!userLocation) return "Acquiring location…";
    // if (loading) return "Loading…";
    return null;
  }, [userLocation, loading]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LocationHeader location={userLocation} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chipsContainer}>
          <CategoryChips value={filter} onChange={setFilter} contentPadding={20} />
        </View>

        {statusText && <Text style={styles.statusText}>{statusText}</Text>}

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

        {store && (
          <StoreCard store={store} dimmed={loading} userLocation={userLocation} />
        )}

        <Text style={styles.disclaimer}>
          Locates nearby venues only · No purchases made through this app
        </Text>
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

const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  chipsContainer: {
    marginBottom: 8,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  compassContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  mapThumb: {
    width: "100%",
    marginBottom: 12,
  },
  disclaimer: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    textAlign: "center",
    marginTop: 12,
  },
}));
