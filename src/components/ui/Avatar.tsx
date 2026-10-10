import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { fonts, makeStyles } from "../../theme";

type Props = {
  name: string;
  /** Profile photo URL; falls back to the initial when missing or broken. */
  uri?: string | null;
  size?: number;
};

/** Decorative: the name next to it is what's read out. */
export const Avatar: React.FC<Props> = ({ name, uri, size = 40 }) => {
  const styles = useStyles();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const showPhoto = uri != null && uri !== failedUri;

  return (
    <View style={[styles.avatar, shape]} accessibilityElementsHidden importantForAccessibility="no">
      {showPhoto ? (
        <Image source={{ uri }} style={shape} onError={() => setFailedUri(uri)} />
      ) : (
        <Text style={[styles.text, { fontSize: Math.round(size * 0.42) }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  avatar: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  text: {
    color: colors.primary,
    fontFamily: fonts.headline,
  },
}));
