import { Alert, Platform, ToastAndroid } from "react-native";

type ToastType = "info" | "success" | "error";

const showNativeToast = (text: string, type: ToastType = "info") => {
  if (Platform.OS === "android") {
    const duration = text.length > 50 ? ToastAndroid.LONG : ToastAndroid.SHORT;
    ToastAndroid.show(text, duration);
  } else {
    // iOS: Only show alerts for errors
    if (type === "error") {
      Alert.alert("Error", text, [{ text: "OK", onPress: () => {} }]);
    }
    // Info and success messages are silent on iOS (no native equivalent)
  }
};

export const nativeToast = {
  show: (text: string, type?: ToastType) => showNativeToast(text, type || "info"),
  error: (text: string) => showNativeToast(text, "error"),
  success: (text: string) => showNativeToast(text, "success"),
  info: (text: string) => showNativeToast(text, "info"),
};
