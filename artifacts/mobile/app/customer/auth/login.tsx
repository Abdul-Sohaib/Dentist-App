import { Feather } from "@expo/vector-icons";
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
import { Button, Input } from "@/components/UI";
import { useApp } from "@/context/AppContext";

export default function CustomerLoginScreen() {
  const { customerLogin } = useApp();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError("");
      if (!phone.trim() || !password.trim()) {
        setError("Phone number and password are required");
        return;
      }
      setLoading(true);
      await customerLogin({ phone: phone.trim(), password });
      router.replace("/customer/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setLoading(false);
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
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.replace("/")} style={styles.back}>
          <Feather name="arrow-left" size={18} color={Colors.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Patient Login</Text>
          <Text style={styles.subtitle}>Sign in to book and track appointments</Text>

          <Input
            label="Phone Number"
            icon="phone"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              setError("");
            }}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
          />

          <Input
            label="Password"
            icon="lock"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError("");
            }}
            placeholder="Enter password"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Login"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            icon="log-in"
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New patient?</Text>
          <Pressable onPress={() => router.replace("/customer/auth/register")}>
            <Text style={styles.footerLink}>Create account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, gap: 20 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  backText: { fontFamily: "Inter_500Medium", color: Colors.text.secondary, fontSize: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
    }),
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text.primary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.secondary, marginTop: -8 },
  error: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.status.cancelled },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footerText: { fontFamily: "Inter_400Regular", color: Colors.text.secondary, fontSize: 13 },
  footerLink: { fontFamily: "Inter_600SemiBold", color: Colors.primary, fontSize: 13 },
});
