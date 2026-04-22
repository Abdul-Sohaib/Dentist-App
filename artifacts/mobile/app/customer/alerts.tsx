import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function CustomerAlertsScreen() {
  const { customerAlerts, clearCustomerAlert, clearAllCustomerAlerts } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 18 : insets.top + 8 }]}>
        <Pressable onPress={() => router.replace("/customer/home")} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Alert History</Text>
        <Pressable
          onPress={() => {
            if (customerAlerts.length === 0) return;
            clearAllCustomerAlerts().catch(() => {});
          }}
          style={({ pressed }) => [styles.clearAllBtn, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {customerAlerts.length === 0 ? (
          <Text style={styles.empty}>No alerts found</Text>
        ) : (
          customerAlerts.map((alert) => (
            <View key={alert.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{alert.title}</Text>
                  <Text style={styles.time}>{new Date(alert.createdAt).toLocaleString()}</Text>
                </View>
                <Pressable
                  onPress={() => clearCustomerAlert(alert.id).catch(() => {})}
                  style={({ pressed }) => [styles.clearOneBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Feather name="x" size={14} color={Colors.status.cancelled} />
                </Pressable>
              </View>
              <Text style={styles.message}>{alert.message}</Text>
              {alert.appointmentId ? (
                <Text style={styles.meta}>Appointment ID: {alert.appointmentId}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text.primary },
  clearAllBtn: {
    minWidth: 64,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.status.cancelled,
  },
  scroll: { padding: 20, gap: 10 },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardHeader: { gap: 4, flex: 1 },
  clearOneBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.status.cancelledBg,
  },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text.primary },
  time: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.muted },
  message: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.secondary, lineHeight: 18 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.primary },
  empty: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.muted, textAlign: "center" },
});
