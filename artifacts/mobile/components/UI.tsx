import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Colors from "@/constants/colors";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  size = "md",
  fullWidth = true,
}: ButtonProps) {
  const bg = {
    primary: Colors.primary,
    secondary: Colors.secondary,
    outline: "transparent",
    ghost: "transparent",
    danger: "#EF4444",
  }[variant];

  const borderColor = {
    primary: Colors.primary,
    secondary: Colors.secondary,
    outline: Colors.border,
    ghost: "transparent",
    danger: "#EF4444",
  }[variant];

  const textColor = {
    primary: "#fff",
    secondary: "#fff",
    outline: Colors.text.primary,
    ghost: Colors.primary,
    danger: "#fff",
  }[variant];

  const height = { sm: 38, md: 48, lg: 54 }[size];
  const fontSize = { sm: 14, md: 15, lg: 16 }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: 1,
          height,
          opacity: pressed ? 0.82 : disabled || loading ? 0.5 : 1,
          width: fullWidth ? "100%" : undefined,
          paddingHorizontal: fullWidth ? undefined : 20,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: textColor, fontSize },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  autoCapitalize?: "none" | "sentences" | "words";
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  multiline,
  numberOfLines,
  error,
  autoCapitalize = "sentences",
}: InputProps) {
  return (
    <View style={styles.inputContainer}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          multiline && { height: (numberOfLines ?? 3) * 24, textAlignVertical: "top" },
          error ? { borderColor: "#EF4444" } : null,
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          style,
          { opacity: pressed ? 0.94 : 1 },
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

interface StatusBadgeProps {
  status: "pending" | "accepted" | "rejected" | "completed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    pending: { label: "Pending", bg: Colors.status.pendingBg, color: Colors.status.pending },
    accepted: { label: "Accepted", bg: Colors.status.acceptedBg, color: Colors.status.accepted },
    rejected: { label: "Rejected", bg: Colors.status.rejectedBg, color: Colors.status.rejected },
    completed: { label: "Completed", bg: Colors.status.completedBg, color: Colors.status.completed },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text.primary,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Colors.shadow.opacity,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: {
        shadowColor: Colors.shadow.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Colors.shadow.opacity,
        shadowRadius: 8,
      },
    }),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
});
