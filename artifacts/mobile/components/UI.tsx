import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Colors from "@/constants/colors";
import type { Appointment } from "@/context/AppContext";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const sizeStyle = size === "lg" ? styles.btnLg : size === "sm" ? styles.btnSm : styles.btnMd;
  const variantStyle =
    variant === "secondary"
      ? styles.btnSecondary
      : variant === "outline"
      ? styles.btnOutline
      : variant === "ghost"
      ? styles.btnGhost
      : variant === "danger"
      ? styles.btnDanger
      : styles.btnPrimary;
  const textStyle =
    variant === "outline"
      ? styles.btnTextOutline
      : variant === "ghost"
      ? styles.btnTextGhost
      : variant === "danger"
      ? styles.btnTextDanger
      : styles.btnTextDefault;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        sizeStyle,
        variantStyle,
        (disabled || loading) && styles.btnDisabled,
        { opacity: pressed ? 0.82 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <>
          {icon && (
            <Feather
              name={icon}
              size={size === "sm" ? 14 : 16}
              color={
                variant === "outline"
                  ? Colors.primary
                  : variant === "ghost"
                  ? Colors.text.primary
                  : variant === "danger"
                  ? Colors.status.cancelled
                  : Colors.white
              }
            />
          )}
          <Text style={[styles.btnText, textStyle, size === "sm" && styles.btnTextSm]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        {icon && (
          <Feather name={icon} size={16} color={Colors.text.muted} style={styles.inputIcon} />
        )}
        <TextInput
          placeholderTextColor={Colors.text.muted}
          style={[styles.input, icon && styles.inputWithIcon, style as any]}
          {...props}
        />
      </View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

interface StatusBadgeProps {
  status: Appointment["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label =
    status === "pending"
      ? "Pending"
      : status === "confirmed"
      ? "Confirmed"
      : status === "completed"
      ? "Completed"
      : "Cancelled";

  const bg =
    status === "pending"
      ? Colors.status.pendingBg
      : status === "confirmed"
      ? Colors.status.confirmedBg
      : status === "completed"
      ? Colors.status.completedBg
      : Colors.status.cancelledBg;

  const color =
    status === "pending"
      ? Colors.status.pending
      : status === "confirmed"
      ? Colors.status.confirmed
      : status === "completed"
      ? Colors.status.completed
      : Colors.status.cancelled;

  const dot =
    status === "pending"
      ? "clock"
      : status === "confirmed"
      ? "check-circle"
      : status === "completed"
      ? "check"
      : "x-circle";

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Feather name={dot as any} size={11} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle, action, onAction }: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Feather name={icon} size={28} color={Colors.text.muted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.emptyAction, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.emptyActionText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
});

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  btnSm: { paddingHorizontal: 14, paddingVertical: 8 },
  btnMd: { paddingHorizontal: 18, paddingVertical: 13 },
  btnLg: { paddingHorizontal: 24, paddingVertical: 16 },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.secondary },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnGhost: { backgroundColor: "transparent" },
  btnDanger: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.status.cancelledBg,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  btnTextSm: { fontSize: 13 },
  btnTextDefault: { color: Colors.white },
  btnTextOutline: { color: Colors.text.primary },
  btnTextGhost: { color: Colors.text.secondary },
  btnTextDanger: { color: Colors.status.cancelled },
  inputWrap: { gap: 6 },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  inputRowError: { borderColor: Colors.status.cancelled },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputWithIcon: { paddingLeft: 8 },
  inputError: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.status.cancelled,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...CARD_SHADOW,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  sectionAction: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  emptyAction: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  emptyActionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
});
