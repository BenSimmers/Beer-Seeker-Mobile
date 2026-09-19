import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useStyles } from "./styles";

export const AGE_VERIFIED_KEY = "age_verified_v1";

type Props = {
  onVerified: () => void;
};

export const AgeGate: React.FC<Props> = ({ onVerified }) => {
  const styles = useStyles();

  const confirm = async () => {
    await AsyncStorage.setItem(AGE_VERIFIED_KEY, "true");
    onVerified();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compass</Text>
      <Text style={styles.subtitle}>Find the nearest liquor store</Text>

      <View style={styles.divider} />

      <Text style={styles.body}>
        This app locates nearby stores using your device's location and compass. No purchases are
        made through this app.
      </Text>
      <Text style={styles.body}>
        By continuing, you confirm you are of legal drinking age in your jurisdiction.
      </Text>

      <Pressable style={styles.confirmBtn} onPress={confirm}>
        <Text style={styles.confirmText}>I am of legal age — Enter</Text>
      </Pressable>
    </View>
  );
};
