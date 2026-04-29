import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Appointment, useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import { EmptyState, StatusBadge } from "@/components/UI";

type Filter = "all" | Appointment["status"];
const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AppointmentsScreen() {
  const { appointments, patients, updateAppointmentStatus, deleteAppointment, refreshDentistDashboard } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);
    return [...list].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [appointments, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const apt of filtered) {
      if (!map.has(apt.date)) map.set(apt.date, []);
      map.get(apt.date)!.push(apt);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleStatus = async (id: string, status: Appointment["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateAppointmentStatus(id, status);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshDentistDashboard();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Appointments</Text>
            <Text style={styles.subtitle}>{appointments.length} total</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [styles.refreshBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="refresh-cw" size={15} color={Colors.primary} />
              <Text style={styles.refreshBtnText}>{isRefreshing ? "Refreshing..." : "Refresh"}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/appointments/book");
              }}
              style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Feather name="plus" size={20} color={Colors.white} />
              <Text style={styles.addBtnText}>Book</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? appointments.length
                : appointments.filter((a) => a.status === f.value).length;
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                  {count > 0 && <Text style={styles.filterCount}> {count}</Text>}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {grouped.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No appointments"
            subtitle="Book an appointment for one of your patients"
            action="Book Appointment"
            onAction={() => router.push("/appointments/book")}
          />
        ) : (
          grouped.map(([date, apts]) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateLabelRow}>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>
                    {date === today ? "Today" : date > today ? "Upcoming" : "Past"} · {fmtDate(date)}
                  </Text>
                </View>
              </View>
              {apts.map((apt) => {
                const patient = patients.find((p) => p.id === apt.patientId);
                return (
                  <View key={apt.id} style={styles.aptCard}>
                    <View style={styles.aptCardTop}>
                      <View style={styles.aptPatientRow}>
                        <View style={styles.patientAvatar}>
                          <Text style={styles.patientAvatarText}>
                            {(patient?.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.patientName} numberOfLines={1}>
                            {patient?.name ?? "Unknown Patient"}
                          </Text>
                          <Text style={styles.aptMeta}>
                            {apt.time} · {apt.problem}
                          </Text>
                        </View>
                        <StatusBadge status={apt.status} />
                      </View>
                    </View>
                    {apt.issueMedia?.url ? (
                      <View style={styles.issueMediaWrap}>
                        <Text style={styles.issueMediaTitle}>Patient Issue Media</Text>
                        {apt.issueMedia.resourceType === "image" ? (
                          <Image source={{ uri: apt.issueMedia.url }} style={styles.issueImage} />
                        ) : (
                          <Pressable
                            onPress={() => Linking.openURL(apt.issueMedia?.url ?? "")}
                            style={({ pressed }) => [styles.issueVideoBtn, { opacity: pressed ? 0.82 : 1 }]}
                          >
                            <Feather name="play-circle" size={16} color={Colors.primary} />
                            <Text style={styles.issueVideoText}>
                              Play patient video ({Math.ceil(apt.issueMedia.durationSeconds ?? 0)}s)
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : null}

                    {(apt.status === "pending" || apt.status === "confirmed") && (
                      <View style={styles.aptActions}>
                        {apt.status === "pending" && (
                          <Pressable
                            onPress={() => handleStatus(apt.id, "confirmed")}
                            style={({ pressed }) => [styles.actionBtn, styles.actionConfirm, { opacity: pressed ? 0.8 : 1 }]}
                          >
                            <Feather name="check" size={13} color={Colors.status.confirmed} />
                            <Text style={[styles.actionBtnText, { color: Colors.status.confirmed }]}>
                              Confirm
                            </Text>
                          </Pressable>
                        )}
                        {apt.status === "confirmed" && (
                          <Pressable
                            onPress={() => handleStatus(apt.id, "completed")}
                            style={({ pressed }) => [styles.actionBtn, styles.actionComplete, { opacity: pressed ? 0.8 : 1 }]}
                          >
                            <Feather name="check-circle" size={13} color={Colors.status.completed} />
                            <Text style={[styles.actionBtnText, { color: Colors.status.completed }]}>
                              Complete
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => handleStatus(apt.id, "cancelled")}
                          style={({ pressed }) => [styles.actionBtn, styles.actionCancel, { opacity: pressed ? 0.8 : 1 }]}
                        >
                          <Feather name="x" size={13} color={Colors.status.cancelled} />
                          <Text style={[styles.actionBtnText, { color: Colors.status.cancelled }]}>
                            Cancel
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {apt.status === "completed" && (
                      <View style={styles.aptActions}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/appointments/success",
                              params: { appointmentId: apt.id },
                            })
                          }
                          style={({ pressed }) => [styles.actionBtn, styles.actionTicket, { opacity: pressed ? 0.8 : 1 }]}
                        >
                          <Feather name="download" size={13} color={Colors.primary} />
                          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
                            Download Ticket
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 12,
    backgroundColor: Colors.background.secondary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  refreshBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text.primary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.muted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.white },
  filtersRow: { paddingVertical: 4, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  filterTextActive: { color: Colors.white },
  filterCount: { fontFamily: "Inter_400Regular", fontSize: 12 },
  scroll: { paddingHorizontal: 20, paddingTop: 12, gap: 4 },
  dateGroup: { marginBottom: 16 },
  dateLabelRow: { marginBottom: 10 },
  datePill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.background.secondary,
    borderRadius: 6,
  },
  datePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aptCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },
  aptCardTop: { padding: 14 },
  aptPatientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  patientAvatarText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.primary },
  patientName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text.primary },
  aptMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.muted, marginTop: 1 },
  issueMediaWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  issueMediaTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text.secondary,
  },
  issueImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  issueVideoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  issueVideoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },
  aptActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  actionConfirm: { backgroundColor: Colors.status.confirmedBg },
  actionComplete: { backgroundColor: Colors.status.completedBg },
  actionCancel: { backgroundColor: Colors.status.cancelledBg },
  actionTicket: { backgroundColor: Colors.primaryLight },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});

