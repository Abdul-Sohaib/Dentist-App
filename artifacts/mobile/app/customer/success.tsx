import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
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

  const apt = useMemo(
    () => appointments.find((a) => a.id === appointmentId),
    [appointments, appointmentId]
  );

  const dentist = useMemo(
    () => dentists.find((d) => d.id === apt?.dentistId),
    [dentists, apt]
  );

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

  return (
    <View style={[styles.container, { paddingBottom: bottomPad + 24 }]}>
      <View style={styles.iconCircle}>
        <Feather name="check" size={36} color="#fff" />
      </View>

      <Text style={styles.title}>Appointment Booked!</Text>
      <Text style={styles.subtitle}>
        Your appointment is confirmed with the dentist. Check back for status updates.
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

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.replace("/customer/dentists")}
          style={({ pressed }) => [
            styles.primaryBtn,
            { opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.primaryBtnText}>Book Another</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [
            styles.ghostBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
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
    justifyContent: "center",
    paddingHorizontal: 28,
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
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
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
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
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
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  ghostBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.text.secondary,
  },
});
