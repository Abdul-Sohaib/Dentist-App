import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Button, Input } from "@/components/UI";

export default function LoginScreen() {
  const { login } = useApp();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/dashboard");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Invalid email or password");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.secondary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Feather name="activity" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>DentBook</Text>
          <Text style={styles.appTag}>Your clinic, in your pocket</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to manage your clinic</Text>

          <View style={styles.form}>
            <Input
              label="Email address"
              icon="mail"
              placeholder="your@email.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <View>
              <Input
                label="Password"
                icon="lock"
                placeholder="Enter your password"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color={Colors.text.muted}
                />
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={Colors.status.cancelled} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.loginBtn}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.demoBox}>
            <Feather name="info" size={14} color={Colors.primary} />
            <Text style={styles.demoText}>
              Demo: <Text style={styles.demoCredential}>demo@dentbook.com</Text> /{" "}
              <Text style={styles.demoCredential}>demo123</Text>
            </Text>
          </View>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>New to DentBook? </Text>
          <Pressable
            onPress={() => router.push("/auth/signup")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={styles.signupLink}>Create your clinic</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 24,
  },
  logoWrap: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: { boxShadow: `0 4px 16px ${Colors.primary}33` },
    }),
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text.primary,
  },
  appTag: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.muted,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      web: { boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
    }),
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text.primary,
  },
  cardSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: -12,
  },
  form: { gap: 16 },
  eyeBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.status.cancelledBg,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.status.cancelled,
    lineHeight: 18,
  },
  loginBtn: { marginTop: 4 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
  },
  demoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 12,
  },
  demoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.primary,
  },
  demoCredential: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryDark,
  },
  signupRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  signupText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  signupLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
});

