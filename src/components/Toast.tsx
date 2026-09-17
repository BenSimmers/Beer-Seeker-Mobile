import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";

type ToastMessage = {
  id: string;
  text: string;
  type: "error" | "success" | "info";
};

type ToastContextType = {
  show: (text: string, type?: "error" | "success" | "info", duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const show = useCallback(
    (text: string, type: "error" | "success" | "info" = "info", duration = 3000) => {
      const id = String(toastIdRef.current++);
      const toast: ToastMessage = { id, text, type };

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts.slice(-1)} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} message={toast} colors={colors} />
      ))}
    </View>
  );
};

type ToastItemProps = {
  message: ToastMessage;
  colors: Record<string, string>;
};

const ToastItem: React.FC<ToastItemProps> = ({ message, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const bgColor =
    message.type === "error"
      ? colors.surface
      : message.type === "success"
        ? colors.surface
        : colors.surface;

  const textColor =
    message.type === "error"
      ? colors.primary
      : message.type === "success"
        ? colors.primary
        : colors.primary;

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim, backgroundColor: bgColor }]}>
      <Text style={[styles.toastText, { color: textColor }]} numberOfLines={2}>
        {message.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
