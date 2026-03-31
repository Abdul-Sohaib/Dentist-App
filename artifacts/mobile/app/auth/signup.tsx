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

export default function SignupScreen() {
  const { signup } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!clinicName.trim()) e.clinicName = "Clinic name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    signup({
      name: name.trim(),
      clinicName: clinicName.trim(),
      location: location.trim() || "Your City",
      phone: phone.trim() || "",
      email: email.trim().toLowerCase(),
      password,
      bio: bio.trim(),
      workingHours: { start: "09:00", end: "17:00" },
      workingDays: [1, 2, 3, 4, 5],
      slotDuration: 30,
      breaks: [{ start: "13:00", end: "14:00" }],
    });
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/dashboard");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.secondary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={20} color={Colors.text.primary} />
          </Pressable>
          <View>
            <Text style={styles.title}>Create your clinic</Text>
            <Text style={styles.subtitle}>Set up your DentBook account</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Personal Info</Text>
          <View style={styles.form}>
            <Input
              label="Full Name"
              icon="user"
              placeholder="Dr. Jane Smith"
              value={name}
              onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: "" })); }}
              error={errors.name}
              autoCapitalize="words"
            />
            <Input
              label="Phone Number"
              icon="phone"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label="Email"
              icon="mail"
              placeholder="you@clinic.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: "" })); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View>
              <Input
                label="Password"
                icon="lock"
                placeholder="Min. 6 characters"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: "" })); }}
                error={errors.password}
                secureTextEntry={!showPassword}
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
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Clinic Details</Text>
          <View style={styles.form}>
            <Input
              label="Clinic Name"
              icon="home"
              placeholder="BrightSmile Dental Clinic"
              value={clinicName}
              onChangeText={(t) => { setClinicName(t); setErrors((e) => ({ ...e, clinicName: "" })); }}
              error={errors.clinicName}
              autoCapitalize="words"
            />
            <Input
              label="Location (optional)"
              icon="map-pin"
              placeholder="City, State"
              value={location}
              onChangeText={setLocation}
              autoCapitalize="words"
            />
            <Input
              label="Bio (optional)"
              icon="file-text"
              placeholder="Brief description about you and your clinic"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Feather name="settings" size={14} color={Colors.text.muted} />
          <Text style={styles.infoText}>
            Working hours, slot duration, and break times can be configured in Settings after signup.
          </Text>
        </View>

        <Button
          label="Create My Clinic"
          onPress={handleSignup}
          loading={loading}
          size="lg"
          icon="check"
          style={styles.submitBtn}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Pressable
            onPress={() => router.replace("/auth/login")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={styles.loginLink}>Sign In</Text>
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
    gap: 16,
  },
  header: {
    gap: 12,
    marginBottom: 4,
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
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
    }),
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  form: { gap: 14 },
  eyeBtn: {
    position: "absolute",
    right: 14,
    bottom: 14,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
    lineHeight: 18,
  },
  submitBtn: { marginTop: 4 },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },
  loginText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  loginLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
});
