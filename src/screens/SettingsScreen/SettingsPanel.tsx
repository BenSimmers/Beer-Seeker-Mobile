import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { LayoutAnimation, Pressable, Text, View } from "react-native";
import { fonts, makeStyles, useTheme } from "../../theme";

type Props = {
  title: string;
  /** The current choice, shown in the header so it reads while collapsed. */
  summary?: string;
  children: React.ReactNode;
};

/**
 * A settings section that folds away behind its header. Starts collapsed;
 * the screen stays mounted under the tab, so what you open stays open.
 */
export const SettingsPanel: React.FC<Props> = ({ title, summary, children }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View style={[styles.panel, open && styles.panelOpen]}>
      <Pressable
        style={styles.header}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={summary ? `${title}, ${summary}` : title}
      >
        <Text style={styles.title}>{title}</Text>
        {summary != null && (
          <Text style={styles.summary} numberOfLines={1}>
            {summary}
          </Text>
        )}
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={open ? colors.primary : colors.muted}
        />
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  panelOpen: {
    borderColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  summary: {
    flexShrink: 1,
    maxWidth: "50%",
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  body: {
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
}));
