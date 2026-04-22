import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { downloadAppointmentTicket } from "@/utils/ticketPDF";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function generateRef(appointmentId: string, ticketId?: string) {
  if (ticketId?.trim()) return ticketId.trim();
  return "DB" + appointmentId.slice(0, 6).toUpperCase();
}

export default function CustomerSuccess() {
  const params = useLocalSearchParams<{
    appointmentId: string;
    ticketId?: string;
    date: string;
    time: string;
    patientName: string;
    phone: string;
    problem: string;
    clinicName: string;
    doctorName: string;
    location: string;
  }>();
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setTimeout(() => setShown(true), 100);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAppointmentTicket({
        bookingId: params.appointmentId,
        patientName: params.patientName,
        phone: params.phone,
        problem: params.problem,
        date: params.date,
        time: formatTime(params.time),
        clinicName: params.clinicName,
        dentistName: params.doctorName,
        location: params.location,
      });
    } catch {
      Alert.alert("Download Failed", "Could not generate the ticket. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const refCode = generateRef(params.appointmentId || "abc123", params.ticketId);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? 40 : insets.top + 20,
            paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.successIcon, shown && styles.successIconVisible]}>
          <View style={styles.successRing}>
            <View style={styles.successInner}>
              <Feather name="check" size={42} color="#fff" />
            </View>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your appointment has been successfully booked. The clinic will confirm it shortly.
          </Text>
        </View>

        <View style={styles.ticket}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLeft}>
              <Feather name="activity" size={20} color={Colors.primary} />
              <Text style={styles.ticketHeaderText}>DentBook</Text>
            </View>
            <View style={styles.refPill}>
              <Text style={styles.refText}>{refCode}</Text>
            </View>
          </View>

          <View style={styles.ticketDivider}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.cutoutRight} />
          </View>

          <View style={styles.ticketBody}>
            <Text style={styles.ticketClinicName}>{params.clinicName}</Text>
            <Text style={styles.ticketDoctor}>{params.doctorName}</Text>

            <View style={styles.ticketGrid}>
              <View style={styles.ticketCell}>
                <Feather name="calendar" size={14} color={Colors.text.muted} />
                <Text style={styles.ticketCellLabel}>Date</Text>
                <Text style={styles.ticketCellValue}>{formatDate(params.date)}</Text>
              </View>
              <View style={styles.ticketCell}>
                <Feather name="clock" size={14} color={Colors.text.muted} />
                <Text style={styles.ticketCellLabel}>Time</Text>
                <Text style={styles.ticketCellValue}>{formatTime(params.time)}</Text>
              </View>
              <View style={styles.ticketCell}>
                <Feather name="user" size={14} color={Colors.text.muted} />
                <Text style={styles.ticketCellLabel}>Patient</Text>
                <Text style={styles.ticketCellValue}>{params.patientName}</Text>
              </View>
              <View style={styles.ticketCell}>
                <Feather name="phone" size={14} color={Colors.text.muted} />
                <Text style={styles.ticketCellLabel}>Phone</Text>
                <Text style={styles.ticketCellValue}>{params.phone}</Text>
              </View>
            </View>

            <View style={styles.ticketProblem}>
              <Text style={styles.ticketProblemLabel}>Reason for Visit</Text>
              <Text style={styles.ticketProblemValue}>{params.problem}</Text>
            </View>

            <View style={styles.ticketLocation}>
              <Feather name="map-pin" size={13} color={Colors.text.muted} />
              <Text style={styles.ticketLocationText}>{params.location}</Text>
            </View>

            <View style={styles.statusChip}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Pending Confirmation</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Save your reference number <Text style={styles.infoRef}>{refCode}</Text>. The clinic will contact you at your provided phone to confirm.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleDownload}
            disabled={downloading}
            style={({ pressed }) => [styles.downloadBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Feather name="download" size={18} color="#fff" />
            <Text style={styles.downloadBtnText}>
              {downloading ? "Generating..." : "Download Ticket"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/customer/home")}
            style={({ pressed }) => [styles.homeBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Feather name="home" size={16} color={Colors.primary} />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/customer/book")}
            style={({ pressed }) => [styles.anotherBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Feather name="plus" size={16} color={Colors.text.secondary} />
            <Text style={styles.anotherBtnText}>Book Another Appointment</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.secondary },
  scroll: { paddingHorizontal: 20, gap: 20, alignItems: "center" },
  successIcon: {
    opacity: 0,
    transform: [{ scale: 0.7 }],
  },
  successIconVisible: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  successRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  successInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: `0 8px 32px ${Colors.secondary}60` },
    }),
  },
  titleBlock: { alignItems: "center", gap: 8, paddingHorizontal: 20 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  ticket: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20 },
      android: { elevation: 4 },
      web: { boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
    }),
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primaryLight,
    padding: 16,
  },
  ticketHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketHeaderText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },
  refPill: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  refText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff", letterSpacing: 1 },
  ticketDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
  },
  cutoutLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
    marginLeft: -8,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cutoutRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
    marginRight: -8,
  },
  ticketBody: { padding: 20, gap: 14 },
  ticketClinicName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text.primary,
  },
  ticketDoctor: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.muted,
    marginTop: -8,
  },
  ticketGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  ticketCell: {
    width: "46%",
    gap: 3,
  },
  ticketCellLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketCellValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text.primary,
  },
  ticketProblem: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  ticketProblemLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketProblemValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  ticketLocation: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketLocationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
    flex: 1,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B15",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#F59E0B",
  },
  infoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  infoRef: { fontFamily: "Inter_700Bold", color: Colors.primary },
  actions: { width: "100%", gap: 10 },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 8 },
      web: { boxShadow: `0 6px 20px ${Colors.primary}55` },
    }),
  },
  downloadBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  homeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.primary },
  anotherBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  anotherBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
