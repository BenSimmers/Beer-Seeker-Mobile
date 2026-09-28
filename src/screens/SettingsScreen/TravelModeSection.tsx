import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, SectionLabel } from "../../components/ui";
import { TravelSearchModal } from "../../components/TravelSearchModal";
import { useLocation } from "../../location";
import { fonts, makeStyles, useTheme } from "../../theme";
import { IconGlyph } from "./glyphs";
import { SettingRow, useSettingRowStyles } from "./SettingRow";

export const TravelModeSection: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const row = useSettingRowStyles();
  const { travelOrigin, realLocation, setTravelOrigin, clearTravelOrigin } = useLocation();
  const [searchVisible, setSearchVisible] = useState(false);
  const openSearch = () => setSearchVisible(true);

  return (
    <View>
      <SectionLabel>Travel Mode</SectionLabel>

      {travelOrigin ? (
        <Card style={styles.card}>
          <View style={styles.top}>
            <IconGlyph icon="airplane" color={colors.secondary} ringColor={colors.secondary} />
            <View style={row.text}>
              <Text style={[row.title, styles.title]} numberOfLines={2}>
                {travelOrigin.label}
              </Text>
              <Text style={row.description}>
                {`${travelOrigin.lat.toFixed(4)}, ${travelOrigin.lng.toFixed(4)}`}
              </Text>
              {travelOrigin.setAt > 0 && (
                <Text style={row.description}>
                  Set {new Date(travelOrigin.setAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.action}
              onPress={openSearch}
              accessibilityRole="button"
              accessibilityLabel="Change travel location"
            >
              <Text style={styles.actionText}>Change</Text>
            </Pressable>
            <Pressable
              style={[styles.action, styles.actionFilled]}
              onPress={clearTravelOrigin}
              accessibilityRole="button"
              accessibilityLabel="Turn off travel mode"
            >
              <Text style={[styles.actionText, styles.actionTextFilled]}>Turn off</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <SettingRow
          glyph={<IconGlyph icon="airplane-outline" color={colors.muted} />}
          title="Set a location"
          description="Browse somewhere you're not — handy before a trip."
          trailing="chevron"
          onPress={openSearch}
          accessibilityRole="button"
          accessibilityLabel="Set a travel location"
        />
      )}

      <TravelSearchModal
        visible={searchVisible}
        realLocation={realLocation}
        onConfirm={setTravelOrigin}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "column",
    alignItems: "stretch",
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceAlt,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  title: {
    color: colors.secondary,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  action: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionFilled: {
    backgroundColor: colors.secondary,
  },
  actionText: {
    color: colors.secondary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  actionTextFilled: {
    color: colors.background,
  },
}));
