import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

type FilterType = "all" | "pending" | "accepted" | "rejected" | "completed";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AllAppointmentsScreen() {
  const { currentDentist, appointments, updateAppointmentStatus } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<FilterType>("all");

  const myApts = useMemo(
    () =>
      appointments
        .filter((a) => a.dentistId === currentDentist?.id)
        .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1)),
    [appointments, currentDentist]
  );

  const filtered = useMemo(
    () =>
      filter === "all" ? myApts : myApts.filter((a) => a.status === filter),
    [myApts, filter]
  );

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Completed", value: "completed" },
    { label: "Rejected", value: "rejected" },
  ];

  if (!currentDentist) {
    router.replace("/dentist/login");
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle}>All Appointments</Text>
        <Text style={styles.countBadge}>{myApts.length}</Text>
      </View>

      <View style={styles.filtersWrapper}>
        {filters.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[
              styles.filterBtn,
              filter === f.value && styles.filterBtnActive,
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === f.value && styles.filterBtnTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No appointments found</Text>
          </View>
        }
        renderItem={({ item: apt }) => {
          const dateObj = new Date(apt.date + "T00:00:00");
          const displayDate =
            apt.date === today()
              ? "Today"
              : `${DAYS[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS[dateObj.getMonth()]}`;

          return (
            <View style={styles.aptCard}>
              <View style={styles.aptTop}>
                <View style={styles.aptInitials}>
                  <Text style={styles.aptInitialsText}>
                    {apt.customerName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aptName}>{apt.customerName}</Text>
                  <Text style={styles.aptPhone}>{apt.customerPhone}</Text>
                </View>
                <StatusBadge status={apt.status} />
              </View>

              <View style={styles.aptMeta}>
                <View style={styles.metaTag}>
                  <Feather name="calendar" size={13} color={Colors.text.muted} />
                  <Text style={styles.metaTagText}>{displayDate}</Text>
                </View>
                <View style={styles.metaTag}>
                  <Feather name="clock" size={13} color={Colors.text.muted} />
                  <Text style={styles.metaTagText}>{apt.time}</Text>
                </View>
              </View>

              {apt.problem ? (
                <Text style={styles.aptProblem}>{apt.problem}</Text>
              ) : null}

              {apt.status === "pending" && (
                <View style={styles.aptActions}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateAppointmentStatus(apt.id, "accepted");
                    }}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.acceptBtn,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Feather name="check" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateAppointmentStatus(apt.id, "rejected");
                    }}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.rejectBtn,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Feather name="x" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </Pressable>
                </View>
              )}
              {apt.status === "accepted" && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateAppointmentStatus(apt.id, "completed");
                  }}
                  style={({ pressed }) => [
                    styles.doneBtn,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Feather name="check-circle" size={14} color={Colors.status.completed} />
                  <Text style={styles.doneBtnText}>Mark as Completed</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
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
    gap: 14,
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
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text.primary,
    flex: 1,
  },
  countBadge: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.white,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  filtersWrapper: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  filterBtnTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  aptCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  aptTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aptInitials: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  aptInitialsText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },
  aptName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  aptPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  aptMeta: {
    flexDirection: "row",
    gap: 10,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaTagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  aptProblem: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
    fontStyle: "italic",
    backgroundColor: Colors.background.secondary,
    padding: 10,
    borderRadius: 8,
  },
  aptActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptBtn: { backgroundColor: Colors.status.accepted },
  rejectBtn: { backgroundColor: Colors.status.rejected },
  actionBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.status.completedBg,
    borderRadius: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  doneBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.status.completed,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
  },
});
