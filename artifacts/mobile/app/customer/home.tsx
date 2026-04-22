import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
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
import { useApp } from "@/context/AppContext";

function statusColor(status: string) {
  if (status === "accepted") return Colors.status.confirmed;
  if (status === "rejected") return Colors.status.cancelled;
  if (status === "completed") return Colors.status.completed;
  return Colors.status.pending;
}

export default function CustomerDashboard() {
  const {
    currentCustomer,
    clinicProfile,
    customerAppointments,
    customerAlerts,
    customerLogout,
    updateCustomerNotificationPermission,
    refreshCustomerDashboard,
  } = useApp();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!currentCustomer) {
      router.replace("/customer/auth/login");
      return;
    }

    if (currentCustomer.notificationPermission === "unknown") {
      Alert.alert(
        "Enable Notifications",
        "Allow appointment updates and reminder alerts?",
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: () => {
              updateCustomerNotificationPermission("denied").catch(() => {});
            },
          },
          {
            text: "Allow",
            onPress: async () => {
              try {
                const NotificationApi = (globalThis as any)?.Notification;
                if (NotificationApi?.requestPermission) {
                  const permission = await NotificationApi.requestPermission();
                  if (permission === "granted") {
                    await updateCustomerNotificationPermission("granted");
                  } else {
                    await updateCustomerNotificationPermission("denied");
                  }
                  return;
                }
                await updateCustomerNotificationPermission("granted");
              } catch {
                updateCustomerNotificationPermission("denied").catch(() => {});
              }
            },
          },
        ]
      );
    }
  }, [currentCustomer, updateCustomerNotificationPermission]);

  if (!currentCustomer) return null;

  const upcoming = customerAppointments.filter(
    (item) => item.status === "pending" || item.status === "accepted"
  );
  const recentAlerts = customerAlerts.slice(0, 4);
  const unreadCount = customerAlerts.length;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const visitingDays = (clinicProfile.workingDays ?? [])
    .map((day) => dayNames[day] ?? "")
    .filter(Boolean)
    .join(", ");
  const visitingHours = `${clinicProfile.workingHours?.start ?? "-"} to ${clinicProfile.workingHours?.end ?? "-"}`;
  const consultationTime = clinicProfile.slotDuration
    ? `${clinicProfile.slotDuration} minutes per patient`
    : "-";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? 24 : insets.top + 8,
            paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 30,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome, {currentCustomer.name}</Text>
            <Text style={styles.sub}>Manage bookings and alerts in one place</Text>
          </View>
          <Pressable
            onPress={() => router.push("/customer/alerts")}
            style={({ pressed }) => [styles.bellBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Feather name="bell" size={16} color={Colors.primary} />
            {unreadCount > 0 ? (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>{unreadCount > 9 ? "9+" : String(unreadCount)}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={async () => {
              await customerLogout();
              router.replace("/");
            }}
            style={styles.logout}
          >
            <Feather name="log-out" size={15} color={Colors.text.secondary} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Doctor</Text>
          <Text style={styles.doctorName}>{clinicProfile.name || "Doctor"}</Text>
          <Text style={styles.clinicName}>{clinicProfile.clinicName || "Clinic"}</Text>
          <View style={styles.row}>
            <Feather name="phone" size={14} color={Colors.text.muted} />
            <Text style={styles.rowText}>{clinicProfile.phone || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Feather name="award" size={14} color={Colors.text.muted} />
            <Text style={styles.rowText}>
              Specialization: {clinicProfile.specialty?.trim() || "General Dentistry"}
            </Text>
          </View>
          <View style={styles.row}>
            <Feather name="map-pin" size={14} color={Colors.text.muted} />
            <Text style={styles.rowText}>{clinicProfile.location || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Feather name="calendar" size={14} color={Colors.text.muted} />
            <Text style={styles.rowText}>Visiting Days: {visitingDays || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Feather name="clock" size={14} color={Colors.text.muted} />
            <Text style={styles.rowText}>Visiting Hours: {visitingHours}</Text>
          </View>
          <View style={styles.row}>
            <Feather name="user-check" size={14} color={Colors.text.muted} />
            <Text style={styles.rowText}>Consultation Time: {consultationTime}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/customer/book")}
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Feather name="calendar" size={16} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Book Appointment</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>
            {clinicProfile.bio?.trim()
              ? clinicProfile.bio
              : "Doctor profile description is not added yet."}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Current & Past Appointments</Text>
            <Pressable onPress={refreshCustomerDashboard}>
              <Feather name="refresh-cw" size={14} color={Colors.primary} />
            </Pressable>
          </View>
          {customerAppointments.length === 0 ? (
            <Text style={styles.empty}>No appointments yet</Text>
          ) : (
            customerAppointments.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.appointmentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticket}>{item.ticketId || item.id}</Text>
                  <Text style={styles.meta}>{item.date} at {item.time}</Text>
                  <Text style={styles.meta}>{item.bookedForName || currentCustomer.name}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${statusColor(item.status)}20` }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
          {upcoming.length > 0 ? (
            <Text style={styles.upcomingText}>
              Upcoming appointments: {upcoming.length}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Alerts / Notifications</Text>
            <Pressable onPress={() => router.push("/customer/alerts")}>
              <Text style={styles.link}>View all</Text>
            </Pressable>
          </View>
          {recentAlerts.length === 0 ? (
            <Text style={styles.empty}>No alerts yet</Text>
          ) : (
            recentAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertRow}>
                <Feather name="bell" size={14} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMsg}>{alert.message}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.secondary },
  scroll: { paddingHorizontal: 20, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  greeting: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text.primary },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.secondary },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: -5,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.status.cancelled,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeDotText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.white,
  },
  logout: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
    }),
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text.primary },
  doctorName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.primary },
  clinicName: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text.secondary },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.secondary },
  aboutText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
  },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.white },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
  },
  ticket: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text.primary },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.secondary },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  upcomingText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary, marginTop: 4 },
  link: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary },
  alertRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  alertTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text.primary },
  alertMsg: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.secondary, lineHeight: 16 },
  empty: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.muted },
});
