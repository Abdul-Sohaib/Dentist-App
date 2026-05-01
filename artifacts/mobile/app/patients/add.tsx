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

export default function AddPatientScreen() {
  const { addPatient } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; age?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: { name?: string; phone?: string; age?: string } = {};
    if (!name.trim()) e.name = "Patient name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    if (age.trim() && Number.isNaN(Number(age))) e.age = "Age must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const patient = await addPatient({
      name: name.trim(),
      phone: phone.trim(),
      age: age.trim() ? Number(age) : null,
      notes: notes.trim(),
    });
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/patients/${patient.id}`);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/patients");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.secondary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Patient</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>
              {name.trim()
                ? name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                : "?"}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Patient Photo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Information</Text>
          <View style={styles.form}>
            <Input
              label="Full Name *"
              icon="user"
              placeholder="Jane Smith"
              value={name}
              onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
              error={errors.name}
              autoCapitalize="words"
            />
            <Input
              label="Phone Number *"
              icon="phone"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: undefined })); }}
              error={errors.phone}
              keyboardType="phone-pad"
            />
            <Input
              label="Age"
              icon="hash"
              placeholder="e.g. 32"
              value={age}
              onChangeText={(t) => { setAge(t); setErrors((e) => ({ ...e, age: undefined })); }}
              error={errors.age}
              keyboardType="number-pad"
            />
            <Input
              label="Notes / Problem Description"
              icon="file-text"
              placeholder="Describe the patient's condition, allergies, or any notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>
        </View>

        <Button
          label="Save Patient"
          onPress={handleSave}
          loading={loading}
          size="lg"
          icon="user-check"
          style={styles.saveBtn}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background.secondary,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  avatarSection: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary + "30",
  },
  bigAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.primary,
  },
  avatarHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
    }),
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  form: { gap: 14 },
  saveBtn: { marginTop: 4 },
});

