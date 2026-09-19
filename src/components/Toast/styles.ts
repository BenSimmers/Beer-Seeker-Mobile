import { StyleSheet } from "react-native";
import { fonts } from "../../theme";

export const useStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 16,
      zIndex: 9999,
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 10,
      gap: 10,
    },
    toastContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    toastIcon: {
      marginTop: 1,
      flexShrink: 0,
    },
    toastText: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 17,
      flex: 1,
      color: colors.body,
    },
    closeBtn: {
      padding: 6,
      flexShrink: 0,
    },
  });
};
