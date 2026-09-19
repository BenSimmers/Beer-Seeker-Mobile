import React, { useEffect, useMemo, useRef } from "react";
import { Platform, Text, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { LiquorStore, UserLocation } from "../../types";
import { useTheme } from "../../theme";
import { formatDistance } from "../../utils/geo";
import { openInMaps } from "../../services/storeInteractions";
import { useDarkMapStyle, useStyles } from "./styles";

type Props = {
  store: LiquorStore;
  userLocation: UserLocation;
  dimmed?: boolean;
  variant?: "full" | "thumbnail";
  style?: StyleProp<ViewStyle>;
};

const REGION_PADDING = 2.5;
const MIN_DELTA = 0.01;

const regionFor = (store: LiquorStore, user: UserLocation): Region => ({
  latitude: (store.lat + user.lat) / 2,
  longitude: (store.lng + user.lng) / 2,
  latitudeDelta: Math.max(Math.abs(store.lat - user.lat) * REGION_PADDING, MIN_DELTA),
  longitudeDelta: Math.max(Math.abs(store.lng - user.lng) * REGION_PADDING, MIN_DELTA),
});

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
  const region = useMemo(() => regionFor(store, userLocation), [store, userLocation]);
  const isThumbnail = variant === "thumbnail";

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
