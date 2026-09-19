import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { useStyles } from "./styles";

type ToastMessage = {
  id: string;
  text: string;
  type: "error" | "success" | "warning" | "info";
};

type ToastContextType = {
  show: (text: string, type?: "error" | "success" | "warning" | "info") => void;
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
    (text: string, type: "error" | "success" | "warning" | "info" = "info") => {
      const id = String(toastIdRef.current++);
      setToasts((prev) => [...prev, { id, text, type }]);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} message={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
};

type ToastItemProps = {
  message: ToastMessage;
  onDismiss: () => void;
};

const ToastItem: React.FC<ToastItemProps> = ({ message, onDismiss }) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    dismissTimeoutRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 4000);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [fadeAnim, onDismiss]);

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (message.type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      default:
        return "information-circle";
    }
  };

  const getColor = (): string => {
    switch (message.type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return colors.primary;
    }
  };

  const color = getColor();

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  return (
    <Animated.View style={[styles.toast, { borderColor: color, opacity: fadeAnim }]}>
      <View style={styles.toastContent}>
        <Ionicons name={getIconName()} size={20} color={color} style={styles.toastIcon} />
        <Text style={[styles.toastText, { color: colors.headline }]} numberOfLines={3}>
          {message.text}
        </Text>
      </View>
      <Pressable onPress={handleDismiss} style={styles.closeBtn} hitSlop={12}>
        <Ionicons name="close" size={18} color={color} />
      </Pressable>
    </Animated.View>
  );
};
