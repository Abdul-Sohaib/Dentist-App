import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
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
import { StatusBadge } from "@/components/UI";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const { currentDentist, appointments, patients } = useApp();
  const insets = useSafeAreaInsets();
  const today = todayStr();

  const todayApts = useMemo(
    () => appointments
      .filter((a) => a.date === today && a.status !== "cancelled")
      .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today]
  );

  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const upcoming = appointments.filter(
      (a) => a.date > today && (a.status === "pending" || a.status === "confirmed")
    ).length;
    return { total, pending, confirmed, completed, upcoming, patients: patients.length };
  }, [appointments, patients, today]);

  if (!currentDentist) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Platform.OS === "web" ? 24 : insets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name} numberOfLines={1}>
              {currentDentist.name}
            </Text>
            <Text style={styles.clinic} numberOfLines={1}>
              {currentDentist.clinicName}
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {currentDentist.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Patients"
            value={stats.patients}
            icon="users"
            color={Colors.primary}
            bg={Colors.primaryLight}
            onPress={() => router.push("/patients")}
          />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            icon="calendar"
            color="#8B5CF6"
            bg="#EDE9FE"
            onPress={() => router.push("/appointments")}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon="clock"
            color={Colors.status.pending}
            bg={Colors.status.pendingBg}
            onPress={() => router.push("/appointments")}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon="check-circle"
            color={Colors.status.completed}
            bg={Colors.status.completedBg}
            onPress={() => router.push("/appointments")}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsRow}>
            <QuickAction
              icon="user-plus"
              label="Add Patient"
              color={Colors.secondary}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/patients/add");
              }}
            />
            <QuickAction
              icon="calendar"
              label="Book Appt."
              color={Colors.primary}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/appointments/book");
              }}
            />
            <QuickAction
              icon="bar-chart-2"
              label="Analytics"
              color="#8B5CF6"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/analytics");
              }}
            />
            <QuickAction
              icon="settings"
              label="Settings"
              color={Colors.text.secondary}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/settings");
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              Today's Appointments{" "}
              <Text style={styles.sectionCount}>
                ({todayApts.length})
              </Text>
            </Text>
            <Pressable
              onPress={() => router.push("/appointments")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {todayApts.length === 0 ? (
            <View style={styles.emptyToday}>
              <Feather name="sun" size={24} color={Colors.text.muted} />
              <Text style={styles.emptyTodayText}>No appointments today</Text>
              <Pressable
                onPress={() => router.push("/appointments/book")}
                style={({ pressed }) => [styles.emptyTodayBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.emptyTodayBtnText}>Book One</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.aptList}>
              {todayApts.map((apt) => {
                const patient = patients.find((p) => p.id === apt.patientId);
                return (
                  <Pressable
                    key={apt.id}
                    onPress={() => router.push(`/patients/${apt.patientId}`)}
                    style={({ pressed }) => [styles.aptCard, { opacity: pressed ? 0.95 : 1 }]}
                  >
                    <View style={styles.aptTimeCol}>
                      <Text style={styles.aptTime}>{apt.time}</Text>
                      <View style={styles.aptDot} />
                    </View>
                    <View style={styles.aptInfo}>
                      <Text style={styles.aptPatient} numberOfLines={1}>
                        {patient?.name ?? "Unknown Patient"}
                      </Text>
                      <Text style={styles.aptProblem} numberOfLines={1}>
                        {apt.problem}
                      </Text>
                      <StatusBadge status={apt.status} />
                    </View>
                    <Feather name="chevron-right" size={16} color={Colors.text.muted} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

function StatCard({
  label, value, icon, color, bg, onPress,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.statCard, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function QuickAction({
  icon, label, color, onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.qAction, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.qActionIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.qActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text.primary,
  },
  clinic: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...CARD_SHADOW,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text.primary,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
  section: { marginBottom: 20 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  sectionCount: {
    fontFamily: "Inter_400Regular",
    color: Colors.text.muted,
  },
  seeAll: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  qAction: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...CARD_SHADOW,
  },
  qActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  qActionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  emptyToday: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...CARD_SHADOW,
  },
  emptyTodayText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text.muted,
  },
  emptyTodayBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
  },
  emptyTodayBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  aptList: { gap: 10 },
  aptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...CARD_SHADOW,
  },
  aptTimeCol: {
    alignItems: "center",
    width: 52,
    gap: 4,
  },
  aptTime: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.primary,
    textAlign: "center",
  },
  aptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  aptInfo: {
    flex: 1,
    gap: 4,
  },
  aptPatient: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  aptProblem: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
});
