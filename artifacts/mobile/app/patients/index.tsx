import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import { EmptyState } from "@/components/UI";

export default function PatientsScreen() {
  const { patients, appointments } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q)
    );
  }, [patients, query]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Patients</Text>
            <Text style={styles.subtitle}>{patients.length} total</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/patients/add");
            }}
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Feather name="plus" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <Feather name="search" size={15} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor={Colors.text.muted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={15} color={Colors.text.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title={query ? "No patients found" : "No patients yet"}
            subtitle={query ? "Try a different name or phone number" : "Add your first patient to get started"}
            action={query ? undefined : "Add Patient"}
            onAction={query ? undefined : () => router.push("/patients/add")}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((patient) => {
              const aptCount = appointments.filter((a) => a.patientId === patient.id).length;
              const lastApt = appointments
                .filter((a) => a.patientId === patient.id && a.status === "completed")
                .sort((a, b) => b.date.localeCompare(a.date))[0];
              return (
                <Pressable
                  key={patient.id}
                  onPress={() => router.push(`/patients/${patient.id}`)}
                  style={({ pressed }) => [styles.patientCard, { opacity: pressed ? 0.95 : 1 }]}
                >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientPhone}>{patient.phone}</Text>
                    {patient.notes ? (
                      <Text style={styles.patientNotes} numberOfLines={1}>
                        {patient.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.patientMeta}>
                    <View style={styles.metaBadge}>
                      <Feather name="calendar" size={10} color={Colors.primary} />
                      <Text style={styles.metaBadgeText}>{aptCount}</Text>
                    </View>
                    {lastApt && (
                      <Text style={styles.lastVisit}>
                        Last: {new Date(lastApt.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    )}
                    <Feather name="chevron-right" size={14} color={Colors.text.muted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
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
    paddingBottom: 14,
    backgroundColor: Colors.background.secondary,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.white,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: 12,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  list: { gap: 10 },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  patientAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.primary,
  },
  patientInfo: { flex: 1, gap: 2 },
  patientName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  patientPhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  patientNotes: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
  patientMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
  lastVisit: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.text.muted,
  },
});
