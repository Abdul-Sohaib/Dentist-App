import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { StatusBadge } from "@/components/UI";
import { downloadAppointmentTicket } from "@/utils/ticketPDF";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export default function SuccessScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { appointments, dentists } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const apt = useMemo(
    () => appointments.find((a) => a.id === appointmentId),
    [appointments, appointmentId]
  );

  const dentist = useMemo(
    () => dentists.find((d) => d.id === apt?.dentistId),
    [dentists, apt]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async () => {
    if (!apt || !dentist) return;
    setDownloading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await downloadAppointmentTicket({
        bookingId: apt.id.slice(-10),
        patientName: apt.customerName,
        phone: apt.customerPhone,
        dentistName: dentist.name,
        clinicName: dentist.clinic,
        location: dentist.location,
        date: apt.date,
        time: apt.time,
        problem: apt.problem,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Ticket ready!");
    } catch {
      showToast("Could not generate ticket");
    } finally {
      setDownloading(false);
    }
  };

  if (!apt || !dentist) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.text.muted }}>Appointment not found</Text>
        <Pressable onPress={() => router.replace("/customer/dentists")} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  const dateObj = new Date(apt.date + "T00:00:00");
  const displayDate = `${DAYS[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const bookingRef = apt.id.slice(-10).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
      {toast && (
        <View style={styles.toast}>
          <Feather name="check-circle" size={15} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <View style={styles.iconCircle}>
        <Feather name="check" size={36} color="#fff" />
      </View>

      <Text style={styles.title}>Appointment Booked!</Text>
      <Text style={styles.subtitle}>
        Your appointment is confirmed. Download your ticket below.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardAvatar}>
            <Text style={styles.cardAvatarText}>
              {dentist.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardDr}>{dentist.name}</Text>
            <Text style={styles.cardClinic}>{dentist.clinic}</Text>
          </View>
        </View>

        <View style={styles.detail}>
          <Feather name="hash" size={15} color={Colors.primary} />
          <Text style={[styles.detailText, { color: Colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            #{bookingRef}
          </Text>
        </View>
        <View style={styles.detail}>
          <Feather name="user" size={15} color={Colors.text.muted} />
          <Text style={styles.detailText}>{apt.customerName}</Text>
        </View>
        <View style={styles.detail}>
          <Feather name="phone" size={15} color={Colors.text.muted} />
          <Text style={styles.detailText}>{apt.customerPhone}</Text>
        </View>
        <View style={styles.detail}>
          <Feather name="calendar" size={15} color={Colors.text.muted} />
          <Text style={styles.detailText}>{displayDate}</Text>
        </View>
        <View style={styles.detail}>
          <Feather name="clock" size={15} color={Colors.text.muted} />
          <Text style={styles.detailText}>{apt.time}</Text>
        </View>
        {apt.problem ? (
          <View style={styles.detail}>
            <Feather name="file-text" size={15} color={Colors.text.muted} />
            <Text style={styles.detailText}>{apt.problem}</Text>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <StatusBadge status={apt.status} />
        </View>
      </View>

      <Pressable
        onPress={handleDownload}
        disabled={downloading}
        style={({ pressed }) => [
          styles.downloadBtn,
          { opacity: pressed || downloading ? 0.82 : 1 },
        ]}
      >
        {downloading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="download" size={18} color="#fff" />
        )}
        <Text style={styles.downloadBtnText}>
          {downloading ? "Generating..." : "Download Appointment Ticket"}
        </Text>
      </Pressable>

      <View style={styles.secondaryActions}>
        <Pressable
          onPress={() => router.replace("/customer/dentists")}
          style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.outlineBtnText}>Book Another</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.ghostBtnText}>Go to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  homeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  homeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  toast: {
    position: "absolute",
    top: Platform.OS === "web" ? 80 : 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    zIndex: 99,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      },
    }),
  },
  toastText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: `0 6px 20px ${Colors.secondary}55`,
      },
    }),
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
      },
    }),
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.primary,
  },
  cardDr: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  cardClinic: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      web: {
        boxShadow: `0 4px 16px ${Colors.primary}4D`,
      },
    }),
  },
  downloadBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  secondaryActions: {
    width: "100%",
    gap: 8,
  },
  outlineBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  outlineBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  ghostBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text.muted,
  },
});
