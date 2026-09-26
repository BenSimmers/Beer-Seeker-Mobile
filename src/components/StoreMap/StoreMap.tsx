import React, { useEffect, useMemo, useRef } from "react";
import { Platform, Text, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { LiquorStore, UserLocation } from "../../types";
import { makeThemed, useTheme } from "../../theme";
import { useStyles } from "./styles";
import { formatDistance } from "../../utils/geo";
import { regionFor } from "../../utils/mapRegion";
import { openInMaps } from "../../services/storeInteractions";

type Props = {
  store: LiquorStore;
  userLocation: UserLocation;
  dimmed?: boolean;
  variant?: "full" | "thumbnail";
  style?: StyleProp<ViewStyle>;
};

export const StoreMap: React.FC<Props> = ({
  store,
  userLocation,
  dimmed = false,
  variant = "full",
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const darkMapStyle = useDarkMapStyle();
  const mapRef = useRef<MapView>(null);
  const region: Region = useMemo(() => regionFor(store, userLocation), [store, userLocation]);
  const isThumbnail = variant === "thumbnail";

  // initialRegion is only read on mount; follow store/user updates manually
  useEffect(() => {
    mapRef.current?.animateToRegion(region, 400);
  }, [region]);

  return (
    <View
      style={[
        styles.mapCard,
        isThumbnail && styles.mapCardThumbnail,
        dimmed && styles.mapCardDimmed,
        style,
      ]}
    >
      <MapView
        ref={mapRef}
        style={[styles.map, isThumbnail && styles.mapNonInteractive]}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        userInterfaceStyle="dark"
        customMapStyle={Platform.OS === "android" ? darkMapStyle : undefined}
        scrollEnabled={!isThumbnail}
        zoomEnabled={!isThumbnail}
        rotateEnabled={!isThumbnail}
        pitchEnabled={!isThumbnail}
      >
        <Marker
          coordinate={{ latitude: store.lat, longitude: store.lng }}
          title={store.name}
          description={store.vicinity || undefined}
          pinColor={colors.primary}
          onCalloutPress={() => openInMaps(store)}
        />
      </MapView>
      {isThumbnail && (
        <View style={styles.expandHint}>
          <Text style={styles.expandHintText}>Tap to expand</Text>
        </View>
      )}
      {!isThumbnail && (
        <View style={styles.distanceBadge} pointerEvents="none">
          <Ionicons name="navigate-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.distanceBadgeText}>{formatDistance(store.distance)}</Text>
        </View>
      )}
    </View>
  );
};

const useDarkMapStyle = makeThemed((colors) => [
  { elementType: "geometry", stylers: [{ color: colors.surface }] },
  { elementType: "labels.text.fill", stylers: [{ color: colors.body }] },
  { elementType: "labels.text.stroke", stylers: [{ color: colors.background }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: colors.surfaceAlt }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: colors.mapWater }] },
]);
