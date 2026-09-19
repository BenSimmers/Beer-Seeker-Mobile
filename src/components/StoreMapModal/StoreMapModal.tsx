import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { LiquorStore, UserLocation } from "../../types";
import { useTheme } from "../../theme";
import { StoreDetailSheet } from "../StoreDetailSheet";
import { StoreMap } from "../StoreMap";
import { useStyles } from "./styles";

type Props = {
  /** Null while nothing is selected; the modal stays mounted but hidden. */
  store: LiquorStore | null;
  userLocation?: UserLocation | null;
  visible: boolean;
  onClose: () => void;
};

export const StoreMapModal: React.FC<Props> = ({ store, userLocation, visible, onClose }) => {
  const [mapAreaHeight, setMapAreaHeight] = useState(0);
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {store?.name}
            </Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <View
            style={styles.mapWrap}
            onLayout={(e) => setMapAreaHeight(e.nativeEvent.layout.height)}
          >
            {store && userLocation && (
              <StoreMap
                store={store}
                userLocation={userLocation}
                variant="full"
                style={styles.map}
              />
            )}
            {store && (
              <StoreDetailSheet
                store={store}
                userLocation={userLocation}
                containerHeight={mapAreaHeight}
              />
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};
