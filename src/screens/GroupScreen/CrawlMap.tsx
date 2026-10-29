import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import type { Crawl, CrawlStop } from "../../../convex/crawl";
import { useDarkMapStyle } from "../../components/StoreMap";
import { fonts, makeStyles, useTheme } from "../../theme";
import { MIN_DELTA } from "../../utils/mapRegion";

const PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

type Props = {
  crawl: Crawl;
  selectedId: CrawlStop["stopId"] | null;
  onSelect: (stopId: CrawlStop["stopId"]) => void;
};

/** All stops in itinerary order. Lines show sequence, not a routed walking path. */
export const CrawlMap: React.FC<Props> = ({ crawl, selectedId, onSelect }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const darkMapStyle = useDarkMapStyle();
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const coordinates = useMemo(
    () => crawl.stops.map((stop) => ({ latitude: stop.lat, longitude: stop.lng })),
    [crawl.stops],
  );
  const first = coordinates[0];
  const coordinateKey = JSON.stringify(coordinates);
  const fittedKey = useRef<string | null>(null);

  const fit = () => {
    if (!first) return;
    if (
      coordinates.every(
        (point) => point.latitude === first.latitude && point.longitude === first.longitude,
      )
    ) {
      map.current?.animateToRegion(
        { ...first, latitudeDelta: MIN_DELTA, longitudeDelta: MIN_DELTA },
        300,
      );
    } else {
      map.current?.fitToCoordinates(coordinates, { edgePadding: PADDING, animated: true });
    }
  };

  useEffect(() => {
    if (!ready || fittedKey.current === coordinateKey) return;
    fittedKey.current = coordinateKey;
    fit();
  });

  if (!first) return null;
  const selected = crawl.stops.find((stop) => stop.stopId === selectedId);

  return (
    <View style={styles.container}>
      <View style={styles.mapCard}>
        <MapView
          ref={map}
          style={styles.map}
          initialRegion={{ ...first, latitudeDelta: MIN_DELTA, longitudeDelta: MIN_DELTA }}
          onMapReady={() => setReady(true)}
          onLayout={() => {
            if (ready) fit();
          }}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          pitchEnabled={false}
          userInterfaceStyle={colors.dark ? "dark" : "light"}
          customMapStyle={Platform.OS === "android" ? darkMapStyle : undefined}
        >
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[6, 6]}
            />
          )}
          {crawl.stops.map((stop, index) => {
            const current = !crawl.completed && index === crawl.currentIndex;
            const visited =
              crawl.completed || (crawl.currentIndex != null && index < crawl.currentIndex);
            const isSelected = selectedId === stop.stopId;
            const status = visited ? "Visited" : current ? "Group’s here" : "Upcoming";
            return (
              <Marker
                key={stop.stopId}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                title={`${index + 1}. ${stop.name}`}
                description={status}
                onPress={() => onSelect(stop.stopId)}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={isSelected ? 3 : current ? 2 : 1}
                accessibilityLabel={`Stop ${index + 1}, ${stop.name}, ${status}`}
              >
                <View
                  style={[
                    styles.pin,
                    visited && styles.visited,
                    current && styles.current,
                    isSelected && styles.selected,
                  ]}
                >
                  <Text style={[styles.pinText, current && styles.currentText]}>{index + 1}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
        <Pressable
          style={styles.fitButton}
          onPress={fit}
          accessibilityRole="button"
          accessibilityLabel="Show all crawl stops on the map"
        >
          <Ionicons name="expand-outline" size={18} color={colors.primary} />
          <Text style={styles.fitText}>All stops</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        {selected
          ? `${crawl.stops.indexOf(selected) + 1}. ${selected.name} · details below`
          : "Tap a numbered stop for details."}
      </Text>
      <Text style={styles.hint}>Dashed lines show stop order, not walking directions.</Text>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: { marginBottom: 14, gap: 6 },
  mapCard: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  visited: { borderColor: colors.muted },
  current: { backgroundColor: colors.primary },
  selected: { borderColor: colors.headline, borderWidth: 3 },
  pinText: { color: colors.headline, fontFamily: fonts.labelBold, fontSize: 13 },
  currentText: { color: colors.background },
  fitButton: {
    position: "absolute",
    right: 10,
    top: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fitText: { color: colors.primary, fontFamily: fonts.labelBold, fontSize: 12 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
}));
