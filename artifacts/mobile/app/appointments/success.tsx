import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { StatusBadge } from "@/components/UI";
import { downloadAppointmentTicket } from "@/utils/ticketPDF";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SuccessScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { appointments, patients, currentDentist } = useApp();
  const insets = useSafeAreaInsets();

  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const apt = useMemo(() => appointments.find((a) => a.id === appointmentId), [appointments, appointmentId]);
  const patient = useMemo(() => patients.find((p) => p.id === apt?.patientId), [patients, apt]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async () => {
    if (!apt || !patient || !currentDentist) return;
    setDownloading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await downloadAppointmentTicket({
        bookingId: apt.id.slice(-10),
        patientName: patient.name,
        phone: patient.phone,
        dentistName: currentDentist.name,
        clinicName: currentDentist.clinicName,
        location: currentDentist.location,
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

  if (!apt || !patient) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.text.muted }}>Appointment not found</Text>
        <Pressable onPress={() => router.replace("/appointments")} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>Back to Appointments</Text>
        </Pressable>
      </View>
    );
  }

  const bookingRef = apt.id.slice(-10).toUpperCase();

  return (
    <View style={styles.screen}>
      {toast && (
        <View style={[styles.toast, { top: Platform.OS === "web" ? 20 : insets.top + 8 }]}>
          <Feather name="check-circle" size={15} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Platform.OS === "web" ? 40 : insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Feather name="check" size={40} color={Colors.white} />
        </View>
        <Text style={styles.title}>Appointment Booked!</Text>
        <Text style={styles.subtitle}>
          The appointment has been scheduled successfully.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>
                {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardPatient}>{patient.name}</Text>
              <Text style={styles.cardPhone}>{patient.phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Feather name="hash" size={14} color={Colors.primary} />
            <Text style={styles.infoLabel}>Booking Ref</Text>
            <Text style={[styles.infoValue, { color: Colors.primary, fontFamily: "Inter_700Bold" }]}>
              #{bookingRef}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="calendar" size={14} color={Colors.text.muted} />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{fmtDate(apt.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="clock" size={14} color={Colors.text.muted} />
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{apt.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="file-text" size={14} color={Colors.text.muted} />
            <Text style={styles.infoLabel}>Reason</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: "right" }]} numberOfLines={2}>
              {apt.problem}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="info" size={14} color={Colors.text.muted} />
            <Text style={styles.infoLabel}>Status</Text>
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

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push({
              pathname: "/appointments/book",
              params: { patientId: patient.id },
            })}
            style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Feather name="calendar" size={15} color={Colors.text.primary} />
            <Text style={styles.outlineBtnText}>Book Another</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/dashboard")}
            style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.ghostBtnText}>Go to Dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  homeBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.primary,
  },
  homeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  toast: {
    position: "absolute",
    left: 24, right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, zIndex: 99,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
    }),
  },
  toastText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  scroll: { paddingHorizontal: 24, alignItems: "center", gap: 20 },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.secondary,
    alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 },
      android: { elevation: 6 },
      web: { boxShadow: `0 6px 20px ${Colors.secondary}66` },
    }),
  },
  title: {
    fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text.primary, textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text.secondary,
    textAlign: "center", lineHeight: 20, marginTop: -8,
  },
  card: {
    width: "100%", backgroundColor: Colors.white,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14 },
      android: { elevation: 4 },
      web: { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
    }),
  },
  cardHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4,
  },
  cardAvatar: {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  cardAvatarText: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.primary },
  cardPatient: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text.primary },
  cardPhone: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.secondary },
  divider: { height: 1, backgroundColor: Colors.border },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.muted, flex: 1 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text.primary },
  downloadBtn: {
    width: "100%", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 4 },
      web: { boxShadow: `0 4px 16px ${Colors.primary}4D` },
    }),
  },
  downloadBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  actions: { width: "100%", gap: 8 },
  outlineBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  outlineBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text.primary },
  ghostBtn: { alignItems: "center", paddingVertical: 10 },
  ghostBtnText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text.muted },
});
