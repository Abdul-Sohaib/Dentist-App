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

export default function CustomerRegisterScreen() {
  const { customerRegister } = useApp();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError("");
      if (!name.trim() || !phone.trim() || !password.trim()) {
        setError("Name, phone and password are required");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      setLoading(true);
      await customerRegister({ name: name.trim(), phone: phone.trim(), password });
      router.replace("/customer/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
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
        <Pressable onPress={() => router.replace("/customer/auth/login")} style={styles.back}>
          <Feather name="arrow-left" size={18} color={Colors.text.primary} />
          <Text style={styles.backText}>Back to login</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Create Patient Account</Text>
          <Text style={styles.subtitle}>Account is required before booking appointments</Text>

          <Input
            label="Full Name"
            icon="user"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError("");
            }}
            placeholder="Your full name"
            autoCapitalize="words"
          />

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
            placeholder="At least 6 characters"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            icon="check"
          />
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
});
