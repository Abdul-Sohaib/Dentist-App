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
import { Input, Button } from "@/components/UI";

export default function DentistLoginScreen() {
  const { login, signup } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [clinic, setClinic] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 500));
    const result = login(email.trim(), password.trim());
    setLoading(false);
    if (!result) {
      setError("Invalid email or password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/dentist/dashboard");
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !clinic.trim()) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 500));
    try {
      signup({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        clinic: clinic.trim(),
        specialty: specialty.trim() || "General Dentistry",
        location: location.trim() || "Not specified",
        phone: phone.trim(),
        rating: 0,
        reviewCount: 0,
        experience: 0,
        workingHours: { start: "09:00", end: "17:00" },
        workingDays: [1, 2, 3, 4, 5],
        slotDuration: 30,
        breaks: [],
        bio: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/dentist/dashboard");
    } catch {
      setError("Could not create account");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.topTitle}>Dentist Portal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Feather name="clipboard" size={28} color={Colors.secondary} />
            </View>
            <Text style={styles.brandText}>
              {tab === "login" ? "Welcome back" : "Create your account"}
            </Text>
            <Text style={styles.brandSubtext}>
              {tab === "login"
                ? "Sign in to manage your appointments"
                : "Get started with your dental practice"}
            </Text>
          </View>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => { setTab("login"); setError(""); }}
              style={[styles.tabBtn, tab === "login" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === "login" && styles.tabBtnTextActive]}>
                Log In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setTab("signup"); setError(""); }}
              style={[styles.tabBtn, tab === "signup" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, tab === "signup" && styles.tabBtnTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            {tab === "signup" && (
              <>
                <Input
                  label="Full Name *"
                  placeholder="Dr. Jane Smith"
                  value={name}
                  onChangeText={setName}
                />
                <View style={{ height: 12 }} />
                <Input
                  label="Clinic Name *"
                  placeholder="Smile Dental Clinic"
                  value={clinic}
                  onChangeText={setClinic}
                />
                <View style={{ height: 12 }} />
                <Input
                  label="Specialty"
                  placeholder="General Dentistry"
                  value={specialty}
                  onChangeText={setSpecialty}
                />
                <View style={{ height: 12 }} />
                <Input
                  label="Location"
                  placeholder="City, State"
                  value={location}
                  onChangeText={setLocation}
                />
                <View style={{ height: 12 }} />
                <Input
                  label="Phone"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <View style={{ height: 12 }} />
              </>
            )}

            <Input
              label="Email *"
              placeholder="your@clinic.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ height: 12 }} />
            <Input
              label="Password *"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 20 }}>
              <Button
                label={tab === "login" ? "Sign In" : "Create Account"}
                onPress={tab === "login" ? handleLogin : handleSignup}
                loading={loading}
              />
            </View>
          </View>

          {tab === "login" && (
            <View style={styles.hint}>
              <Feather name="info" size={13} color={Colors.text.muted} />
              <Text style={styles.hintText}>
                Demo: sarah@brightsmile.com / password123
              </Text>
            </View>
          )}

          <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  brandRow: {
    alignItems: "center",
    marginBottom: 28,
    gap: 8,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  brandText: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text.primary,
    textAlign: "center",
  },
  brandSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text.muted,
  },
  tabBtnTextActive: {
    color: "#fff",
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#EF4444",
    flex: 1,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 16,
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
});
