import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp, type Appointment } from "@/context/AppContext";
import { StatusBadge } from "@/components/UI";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function AppointmentRow({
  apt,
  onAccept,
  onReject,
  onComplete,
}: {
  apt: Appointment;
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
}) {
  const dateObj = new Date(apt.date + "T00:00:00");
  const displayDate =
    apt.date === today()
      ? "Today"
      : `${DAYS[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS[dateObj.getMonth()]}`;

  return (
    <View style={styles.aptRow}>
      <View style={styles.aptInfo}>
        <Text style={styles.aptName}>{apt.customerName}</Text>
        <Text style={styles.aptMeta}>
          {displayDate} · {apt.time}
        </Text>
        {apt.problem ? (
          <Text style={styles.aptProblem} numberOfLines={1}>
            {apt.problem}
          </Text>
        ) : null}
      </View>
      <View style={styles.aptRight}>
        <StatusBadge status={apt.status} />
        {apt.status === "pending" && (
          <View style={styles.aptActions}>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.acceptBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="check" size={14} color="#fff" />
            </Pressable>
            <Pressable
              onPress={onReject}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.rejectBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="x" size={14} color="#fff" />
            </Pressable>
          </View>
        )}
        {apt.status === "accepted" && onComplete && (
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [
              styles.completeBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.completeBtnText}>Done</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function DentistDashboardScreen() {
  const { currentDentist, appointments, updateAppointmentStatus, logout } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const myApts = useMemo(
    () =>
      appointments
        .filter((a) => a.dentistId === currentDentist?.id)
        .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1)),
    [appointments, currentDentist]
  );

  const todayApts = useMemo(
    () => myApts.filter((a) => a.date === today()),
    [myApts]
  );

  const upcomingApts = useMemo(
    () =>
      myApts.filter(
        (a) =>
          a.date > today() &&
          (a.status === "pending" || a.status === "accepted")
      ),
    [myApts]
  );

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logout();
    router.replace("/");
  };

  const stats = useMemo(
    () => ({
      pending: myApts.filter((a) => a.status === "pending").length,
      accepted: myApts.filter((a) => a.status === "accepted").length,
      completed: myApts.filter((a) => a.status === "completed").length,
    }),
    [myApts]
  );

  const sections = [
    ...(todayApts.length > 0
      ? [{ type: "sectionHeader" as const, title: `Today (${todayApts.length})` }]
      : []),
    ...todayApts.map((apt) => ({ type: "apt" as const, apt })),
    ...(upcomingApts.length > 0
      ? [{ type: "sectionHeader" as const, title: `Upcoming (${upcomingApts.length})` }]
      : []),
    ...upcomingApts.map((apt) => ({ type: "apt" as const, apt })),
    ...(todayApts.length === 0 && upcomingApts.length === 0
      ? [{ type: "empty" as const }]
      : []),
  ];

  if (!currentDentist) {
    router.replace("/dentist/login");
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>
            Hi, {currentDentist.name.replace("Dr. ", "")}
          </Text>
          <Text style={styles.clinicName}>{currentDentist.clinic}</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            onPress={() => router.push("/dentist/appointments")}
            style={styles.iconBtn}
          >
            <Feather name="list" size={20} color={Colors.text.secondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/dentist/slots")}
            style={styles.iconBtn}
          >
            <Feather name="settings" size={20} color={Colors.text.secondary} />
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.iconBtn}>
            <Feather name="log-out" size={20} color={Colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: Colors.status.pending, borderLeftWidth: 3 }]}>
          <Text style={styles.statNum}>{stats.pending}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.status.accepted, borderLeftWidth: 3 }]}>
          <Text style={styles.statNum}>{stats.accepted}</Text>
          <Text style={styles.statLbl}>Accepted</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.status.completed, borderLeftWidth: 3 }]}>
          <Text style={styles.statNum}>{stats.completed}</Text>
          <Text style={styles.statLbl}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item, i) =>
          item.type === "apt" ? item.apt.id : `${item.type}-${i}`
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={null}
        renderItem={({ item }) => {
          if (item.type === "sectionHeader") {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          if (item.type === "empty") {
            return (
              <View style={styles.emptyState}>
                <Feather name="calendar" size={40} color={Colors.border} />
                <Text style={styles.emptyTitle}>No upcoming appointments</Text>
                <Text style={styles.emptyDesc}>
                  When patients book with you, they'll show up here
                </Text>
              </View>
            );
          }
          return (
            <AppointmentRow
              apt={item.apt}
              onAccept={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateAppointmentStatus(item.apt.id, "accepted");
              }}
              onReject={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateAppointmentStatus(item.apt.id, "rejected");
              }}
              onComplete={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateAppointmentStatus(item.apt.id, "completed");
              }}
            />
          );
        }}
      />

      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom },
        ]}
      >
        <Pressable style={styles.navItem} onPress={() => {}}>
          <Feather name="home" size={20} color={Colors.primary} />
          <Text style={[styles.navLabel, { color: Colors.primary }]}>Dashboard</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/dentist/appointments")}
        >
          <Feather name="calendar" size={20} color={Colors.text.muted} />
          <Text style={styles.navLabel}>All Bookings</Text>
        </Pressable>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/dentist/slots")}
        >
          <Feather name="clock" size={20} color={Colors.text.muted} />
          <Text style={styles.navLabel}>Slots</Text>
        </Pressable>
      </View>
    </View>
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
    paddingBottom: 14,
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text.primary,
  },
  clinicName: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text.primary,
  },
  statLbl: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text.primary,
    marginBottom: 10,
    marginTop: 4,
  },
  aptRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "flex-start",
    gap: 10,
  },
  aptInfo: {
    flex: 1,
    gap: 3,
  },
  aptName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  aptMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  aptProblem: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
    fontStyle: "italic",
  },
  aptRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  aptActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: Colors.status.accepted,
  },
  rejectBtn: {
    backgroundColor: Colors.status.rejected,
  },
  completeBtn: {
    backgroundColor: Colors.status.completedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.status.completed,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 6,
  },
  navLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text.muted,
  },
});
