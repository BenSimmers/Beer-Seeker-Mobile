import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 24,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    maxWidth: "90%",
    borderWidth: 1,
    borderColor: "#666",
  },
  toastText: {
    fontSize: 14,
    textAlign: "center",
  },
});
