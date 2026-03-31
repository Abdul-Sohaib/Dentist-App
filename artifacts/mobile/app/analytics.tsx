import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatCard({ icon, label, value, sub, color, bg }: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
    </View>
  );
}

function BarChart({ data, maxVal, color }: {
  data: { label: string; value: number }[];
  maxVal: number;
  color: string;
}) {
  const BAR_HEIGHT = 80;
  return (
    <View style={styles.barChart}>
      {data.map((item) => {
        const height = maxVal === 0 ? 4 : Math.max(4, (item.value / maxVal) * BAR_HEIGHT);
        return (
          <View key={item.label} style={styles.barItem}>
            <Text style={styles.barValue}>{item.value > 0 ? item.value : ""}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { appointments, patients } = useApp();
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split("T")[0];
  const startOfWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  })();
  const startOfLastWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - 7);
    return d.toISOString().split("T")[0];
  })();
  const endOfLastWeek = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - 1);
    return d.toISOString().split("T")[0];
  })();

  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const thisWeek = appointments.filter((a) => a.date >= startOfWeek && a.date <= today).length;
    const lastWeek = appointments.filter((a) => a.date >= startOfLastWeek && a.date <= endOfLastWeek).length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const byDay: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const apt of appointments) {
      const d = new Date(apt.date + "T00:00:00");
      byDay[d.getDay()]++;
    }
    const maxByDay = Math.max(...byDay);
    const busiestDayIdx = byDay.indexOf(maxByDay);

    const recentPatients = patients.filter(
      (p) => new Date(p.createdAt) >= new Date(Date.now() - 30 * 86400000)
    ).length;

    return {
      total, completed, pending, confirmed, cancelled,
      thisWeek, lastWeek, completionRate,
      byDay, maxByDay, busiestDay: DAY_LABELS[busiestDayIdx],
      recentPatients,
    };
  }, [appointments, patients, today, startOfWeek, startOfLastWeek, endOfLastWeek]);

  const dayChartData = DAY_LABELS.map((label, i) => ({
    label,
    value: stats.byDay[i],
  }));

  const statusChartData = [
    { label: "Pend.", value: stats.pending },
    { label: "Conf.", value: stats.confirmed },
    { label: "Done", value: stats.completed },
    { label: "Canc.", value: stats.cancelled },
  ];
  const maxStatus = Math.max(stats.pending, stats.confirmed, stats.completed, stats.cancelled, 1);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Platform.OS === "web" ? 24 : insets.top + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Clinic overview</Text>
          </View>
          <View style={styles.dateBadge}>
            <Feather name="calendar" size={12} color={Colors.primary} />
            <Text style={styles.dateBadgeText}>
              {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="users"
            label="Total Patients"
            value={patients.length}
            sub={`+${stats.recentPatients} this month`}
            color={Colors.primary}
            bg={Colors.primaryLight}
          />
          <StatCard
            icon="calendar"
            label="Total Appointments"
            value={stats.total}
            sub={`${stats.thisWeek} this week`}
            color="#8B5CF6"
            bg="#EDE9FE"
          />
          <StatCard
            icon="trending-up"
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            sub={`${stats.completed} completed`}
            color={Colors.status.confirmed}
            bg={Colors.status.confirmedBg}
          />
          <StatCard
            icon="clock"
            label="Pending"
            value={stats.pending + stats.confirmed}
            sub="needs attention"
            color={Colors.status.pending}
            bg={Colors.status.pendingBg}
          />
        </View>

        <View style={styles.weekRow}>
          <View style={[styles.weekCard, { borderColor: Colors.primary + "30" }]}>
            <Text style={styles.weekLabel}>This Week</Text>
            <Text style={[styles.weekValue, { color: Colors.primary }]}>{stats.thisWeek}</Text>
          </View>
          <Feather name="arrow-right" size={16} color={Colors.text.muted} />
          <View style={[styles.weekCard, { borderColor: Colors.border }]}>
            <Text style={styles.weekLabel}>Last Week</Text>
            <Text style={[styles.weekValue, { color: Colors.text.secondary }]}>{stats.lastWeek}</Text>
          </View>
          <View style={[styles.weekCard, { backgroundColor: stats.thisWeek >= stats.lastWeek ? Colors.status.confirmedBg : Colors.status.cancelledBg }]}>
            <Text style={styles.weekLabel}>Change</Text>
            <Text style={[styles.weekValue, { color: stats.thisWeek >= stats.lastWeek ? Colors.status.confirmed : Colors.status.cancelled }]}>
              {stats.lastWeek === 0
                ? "—"
                : `${stats.thisWeek >= stats.lastWeek ? "+" : ""}${stats.thisWeek - stats.lastWeek}`}
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Appointments by Day</Text>
            {stats.maxByDay > 0 && (
              <View style={styles.busiestBadge}>
                <Text style={styles.busiestText}>Busiest: {stats.busiestDay}</Text>
              </View>
            )}
          </View>
          <BarChart data={dayChartData} maxVal={stats.maxByDay || 1} color={Colors.primary} />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Appointments by Status</Text>
          <BarChart data={statusChartData} maxVal={maxStatus} color={Colors.secondary} />
          <View style={styles.statusLegend}>
            {[
              { label: "Pending", color: Colors.status.pending },
              { label: "Confirmed", color: Colors.status.confirmed },
              { label: "Completed", color: Colors.status.completed },
              { label: "Cancelled", color: Colors.status.cancelled },
            ].map((s) => (
              <View key={s.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendText}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
  web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  scroll: { paddingHorizontal: 20, paddingBottom: 8, gap: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text.primary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.muted },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.primary },
  statsGrid: { gap: 10 },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...CARD_SHADOW,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text.primary },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text.secondary },
  statSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 4,
    ...CARD_SHADOW,
  },
  weekLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.muted },
  weekValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    ...CARD_SHADOW,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text.primary },
  busiestBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  busiestText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.primary },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingBottom: 4,
  },
  barItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.text.muted,
    minHeight: 14,
  },
  barTrack: {
    width: "100%",
    height: 80,
    justifyContent: "flex-end",
    borderRadius: 6,
    backgroundColor: Colors.background.secondary,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.text.muted,
    textAlign: "center",
  },
  statusLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.secondary },
});
