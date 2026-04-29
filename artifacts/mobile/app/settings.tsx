import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
import BottomNav from "@/components/BottomNav";
import { Button, Input } from "@/components/UI";

const DAYS_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_OPTIONS = [15, 20, 30, 45, 60];

export default function SettingsScreen() {
  const { currentDentist, updateProfile, uploadShowcaseMedia, removeShowcaseMedia, logout } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(currentDentist?.name ?? "");
  const [clinicName, setClinicName] = useState(currentDentist?.clinicName ?? "");
  const [location, setLocation] = useState(currentDentist?.location ?? "");
  const [phone, setPhone] = useState(currentDentist?.phone ?? "");
  const [specialty, setSpecialty] = useState(currentDentist?.specialty ?? "");
  const [bio, setBio] = useState(currentDentist?.bio ?? "");
  const [startHour, setStartHour] = useState(currentDentist?.workingHours.start ?? "09:00");
  const [endHour, setEndHour] = useState(currentDentist?.workingHours.end ?? "17:00");
  const [workingDays, setWorkingDays] = useState<number[]>(currentDentist?.workingDays ?? [1,2,3,4,5]);
  const [slotDuration, setSlotDuration] = useState(currentDentist?.slotDuration ?? 30);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !clinicName.trim()) return;
    await updateProfile({
      name: name.trim(),
      clinicName: clinicName.trim(),
      location: location.trim(),
      phone: phone.trim(),
      specialty: specialty.trim(),
      bio: bio.trim(),
      workingHours: { start: startHour, end: endHour },
      workingDays,
      slotDuration,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of DentBook?")) {
        await logout();
        router.replace("/auth/login");
      }
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        router.replace("/auth/login");
        },
      },
    ]);
  };

  const pickAndUpload = async (kind: "photo" | "video") => {
    if (!currentDentist) return;
    const photoCount = currentDentist.showcasePhotos?.length ?? 0;
    const videoCount = currentDentist.showcaseVideos?.length ?? 0;
    if (kind === "photo" && photoCount >= 3) {
      Alert.alert("Limit reached", "You can upload maximum 3 photos.");
      return;
    }
    if (kind === "video" && videoCount >= 2) {
      Alert.alert("Limit reached", "You can upload maximum 2 videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === "photo" ? ["images"] : ["videos"],
      quality: 0.7,
      allowsMultipleSelection: false,
      base64: true,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Upload failed", "Unable to read selected file.");
      return;
    }
    const mime = asset.mimeType ?? (kind === "photo" ? "image/jpeg" : "video/mp4");
    const dataUri = `data:${mime};base64,${asset.base64}`;
    setUploading(true);
    try {
      await uploadShowcaseMedia(kind, dataUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Upload failed", String(error instanceof Error ? error.message : error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: Platform.OS === "web" ? 24 : insets.top + 8 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(currentDentist?.name ?? "").replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{currentDentist?.name}</Text>
              <Text style={styles.profileClinic}>{currentDentist?.clinicName}</Text>
              <Text style={styles.profileEmail}>{currentDentist?.email}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Info</Text>
            <View style={styles.form}>
              <Input
                label="Full Name"
                icon="user"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Input
                label="Phone"
                icon="phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Input
                label="Specialization"
                icon="award"
                value={specialty}
                onChangeText={setSpecialty}
                autoCapitalize="words"
                placeholder="e.g. Orthodontics"
              />
              <Input
                label="About Me"
                icon="file-text"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
                placeholder="Tell patients about your experience and treatment style..."
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clinic Info</Text>
            <View style={styles.form}>
              <Input
                label="Clinic Name"
                icon="home"
                value={clinicName}
                onChangeText={setClinicName}
                autoCapitalize="words"
              />
              <Input
                label="Location"
                icon="map-pin"
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule</Text>

            <View>
              <Text style={styles.fieldLabel}>Working Days</Text>
              <View style={styles.daysRow}>
                {DAYS_LABELS.map((label, idx) => {
                  const active = workingDays.includes(idx);
                  return (
                    <Pressable
                      key={label}
                      onPress={() => toggleDay(idx)}
                      style={[styles.dayBtn, active && styles.dayBtnActive]}
                    >
                      <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.hoursRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Start Time"
                  icon="sunrise"
                  value={startHour}
                  onChangeText={setStartHour}
                  placeholder="09:00"
                />
              </View>
              <View style={styles.hoursDash}>
                <Text style={styles.hoursDashText}>—</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="End Time"
                  icon="sunset"
                  value={endHour}
                  onChangeText={setEndHour}
                  placeholder="17:00"
                />
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Slot Duration</Text>
              <View style={styles.slotsRow}>
                {SLOT_OPTIONS.map((mins) => (
                  <Pressable
                    key={mins}
                    onPress={() => setSlotDuration(mins)}
                    style={[styles.slotBtn, slotDuration === mins && styles.slotBtnActive]}
                  >
                    <Text style={[styles.slotBtnText, slotDuration === mins && styles.slotBtnTextActive]}>
                      {mins}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Button
            label={saved ? "Saved!" : "Save Changes"}
            onPress={handleSave}
            size="lg"
            icon={saved ? "check" : "save"}
            variant={saved ? "secondary" : "primary"}
            style={styles.saveBtn}
          />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Showcase Media</Text>
            <Text style={styles.profileClinic}>Upload up to 3 photos and 2 videos (max 1 min).</Text>
            <View style={styles.slotsRow}>
              <Button
                label="Add Photo"
                onPress={() => pickAndUpload("photo")}
                icon="image"
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                label="Add Video"
                onPress={() => pickAndUpload("video")}
                icon="video"
                variant="secondary"
                style={{ flex: 1 }}
              />
            </View>
            {uploading ? <Text style={styles.profileClinic}>Uploading...</Text> : null}
            {(currentDentist?.showcasePhotos?.length ?? 0) > 0 ? (
              <View style={styles.form}>
                {currentDentist?.showcasePhotos?.map((item) => (
                  <View key={item.publicId} style={styles.mediaRow}>
                    <Image source={{ uri: item.url }} style={styles.mediaThumb} />
                    <Pressable onPress={() => removeShowcaseMedia(item.publicId)}>
                      <Feather name="trash-2" size={16} color={Colors.status.cancelled} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            {(currentDentist?.showcaseVideos?.length ?? 0) > 0 ? (
              <View style={styles.form}>
                {currentDentist?.showcaseVideos?.map((item) => (
                  <View key={item.publicId} style={styles.mediaRow}>
                    <Text style={styles.rowLabel}>Video ({Math.ceil(item.durationSeconds ?? 0)}s)</Text>
                    <Pressable onPress={() => removeShowcaseMedia(item.publicId)}>
                      <Feather name="trash-2" size={16} color={Colors.status.cancelled} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Account</Text>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="log-out" size={16} color={Colors.status.cancelled} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </View>

          <Text style={styles.version}>DentBook v1.0.0</Text>
          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </View>
  );
}

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
  web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  scroll: { paddingHorizontal: 20, paddingBottom: 8, gap: 16 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...CARD_SHADOW,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.white,
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  profileClinic: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  profileEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    ...CARD_SHADOW,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  form: { gap: 14 },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  dayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.text.secondary,
  },
  dayBtnTextActive: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  hoursDash: {
    paddingBottom: 13,
  },
  hoursDashText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.text.muted,
  },
  slotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  slotBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  slotBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  slotBtnTextActive: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {},
  dangerZone: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...CARD_SHADOW,
  },
  dangerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.status.cancelledBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.status.cancelled,
  },
  version: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: 4,
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 8,
  },
  mediaThumb: {
    width: 80,
    height: 56,
    borderRadius: 8,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
  },
});





