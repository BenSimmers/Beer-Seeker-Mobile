import React from "react";
import { Switch, Text, View } from "react-native";
import { BottomSheet } from "../../components/ui";
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
    <BottomSheet visible={visible} onClose={onClose} title="Filters">
      <View style={styles.option}>
        <View style={styles.optionText}>
          <Text style={styles.label}>Show Open First</Text>
          <Text style={styles.description}>Sort open venues by distance</Text>
        </View>
        <Switch
          accessibilityLabel="Show open first"
          value={openFirst}
          onValueChange={onOpenFirstChange}
          trackColor={{ false: colors.border, true: colors.primaryMuted }}
          thumbColor={openFirst ? colors.primary : colors.muted}
        />
      </View>
    </BottomSheet>
  );
};

const useStyles = makeStyles((colors) => ({
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
