import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function BookingScreen() {
  const { dentistId, date, time } = useLocalSearchParams<{
    dentistId: string;
    date: string;
    time: string;
  }>();
  const { dentists, bookAppointment } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const dentist = useMemo(
    () => dentists.find((d) => d.id === dentistId),
    [dentists, dentistId]
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    else if (phone.replace(/\D/g, "").length < 7)
      e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = async () => {
    if (!validate() || !dentistId || !date || !time) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const apt = bookAppointment({
      dentistId: dentistId,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      problem: problem.trim() || undefined,
      date,
      time,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({
      pathname: "/customer/success",
      params: { appointmentId: apt.id },
    });
  };

  if (!dentist) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: Colors.text.muted }}>Something went wrong</Text>
      </View>
    );
  }

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
          <Text style={styles.topTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryAvatar}>
                <Text style={styles.summaryAvatarText}>
                  {dentist.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </Text>
              </View>
              <View>
                <Text style={styles.summaryDr}>{dentist.name}</Text>
                <Text style={styles.summaryClinic}>{dentist.clinic}</Text>
              </View>
            </View>
            <View style={styles.summaryDateTime}>
              <View style={styles.summaryTag}>
                <Feather name="calendar" size={13} color={Colors.primary} />
                <Text style={styles.summaryTagText}>{formatDisplayDate(date)}</Text>
              </View>
              <View style={styles.summaryTag}>
                <Feather name="clock" size={13} color={Colors.primary} />
                <Text style={styles.summaryTagText}>{time}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your Details</Text>

          <View style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <View style={{ height: 12 }} />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={errors.phone}
            />
            <View style={{ height: 12 }} />
            <Input
              label="Describe your issue (optional)"
              placeholder="e.g. Toothache, routine checkup, cleaning..."
              value={problem}
              onChangeText={setProblem}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.noteCard}>
            <Feather name="info" size={15} color={Colors.primary} />
            <Text style={styles.noteText}>
              Your appointment is pending until the dentist accepts it. You'll see the status on the success screen.
            </Text>
          </View>

          <View style={styles.bookBtnWrapper}>
            <Button
              label="Confirm Appointment"
              onPress={handleBook}
              loading={loading}
            />
          </View>

          <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 16 }} />
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
    paddingBottom: 16,
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
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    gap: 12,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },
  summaryDr: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  summaryClinic: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  summaryDateTime: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  summaryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  summaryTagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.primary,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  bookBtnWrapper: {
    marginBottom: 16,
  },
});
