import React, { useState } from "react";
import { Modal, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { LiquorStore, UserLocation } from "../../types";
import { useStyles } from "./styles";
import { StoreDetailSheet } from "../StoreDetailSheet";
import { StoreMap } from "../StoreMap";
import { RoundIconButton } from "../ui";

type Props = {
  /** Null while nothing is selected; the modal stays mounted but hidden. */
  store: LiquorStore | null;
  userLocation?: UserLocation | null;
  visible: boolean;
  onClose: () => void;
};

export const StoreMapModal: React.FC<Props> = ({ store, userLocation, visible, onClose }) => {
  const [mapAreaHeight, setMapAreaHeight] = useState(0);
  const styles = useStyles();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Modal renders into a separate native root on iOS, so insets from
                the outer SafeAreaProvider don't reach it — needs its own. */}
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {store?.name}
            </Text>
            <RoundIconButton icon="close" onPress={onClose} accessibilityLabel="Close map" />
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
