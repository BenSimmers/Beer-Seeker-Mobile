import React from "react";
import { Modal, Pressable, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  openFirst: boolean;
  onOpenFirstChange: (value: boolean) => void;
};

export const FilterSheet: React.FC<Props> = ({
  visible,
  onClose,
  openFirst,
  onOpenFirstChange,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.headline} />
            </Pressable>
          </View>

          <View style={styles.option}>
            <View style={styles.optionText}>
              <Text style={styles.label}>Show Open First</Text>
              <Text style={styles.description}>Sort open venues by distance</Text>
            </View>
            <Switch
              value={openFirst}
              onValueChange={onOpenFirstChange}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={openFirst ? colors.primary : colors.muted}
            />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const useStyles = makeStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  optionText: {
    flex: 1,
  },
  label: {
    color: colors.headline,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
}));
