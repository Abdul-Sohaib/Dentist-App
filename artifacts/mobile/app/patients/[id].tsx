import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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
import { Button, StatusBadge } from "@/components/UI";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PatientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { patients, appointments, updatePatient, deletePatient } = useApp();
  const insets = useSafeAreaInsets();

  const patient = useMemo(() => patients.find((p) => p.id === id), [patients, id]);
  const patientApts = useMemo(
    () =>
      appointments
        .filter((a) => a.patientId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments, id]
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const startEdit = () => {
    if (!patient) return;
    setEditName(patient.name);
    setEditPhone(patient.phone);
    setEditNotes(patient.notes);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await updatePatient(id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      notes: editNotes.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete ${patient?.name}? This will also remove all their appointments.`)) {
        await deletePatient(id);
        router.replace('/patients');
      }
      return;
    }
    Alert.alert(
      "Delete Patient",
      `Delete ${patient?.name}? This will also remove all their appointments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePatient(id);
        router.replace('/patients');
          },
        },
      ]
    );
  };

  if (!patient) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={32} color={Colors.text.muted} />
        <Text style={styles.notFoundText}>Patient not found</Text>
        <Button label="Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const completed = patientApts.filter((a) => a.status === "completed").length;
  const upcoming = patientApts.filter(
    (a) => (a.status === "pending" || a.status === "confirmed") && a.date >= new Date().toISOString().split("T")[0]
  ).length;

  return (
    <View style={styles.screen}>
      <View style={[styles.headerBar, { paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 }]}>
        <Pressable
          onPress={() => { if (editing) setEditing(false); else router.back(); }}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {editing ? "Edit Patient" : "Patient Profile"}
        </Text>
        {!editing ? (
          <Pressable
            onPress={startEdit}
            style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="edit-2" size={16} color={Colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </Text>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Full Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Patient name"
                  placeholderTextColor={Colors.text.muted}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Phone</Text>
                <TextInput
                  style={styles.editInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Notes</Text>
                <TextInput
                  style={[styles.editInput, { minHeight: 80, textAlignVertical: "top" }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Conditions, allergies, notes..."
                  placeholderTextColor={Colors.text.muted}
                  multiline
                />
              </View>
              <View style={styles.editActions}>
                <Button label="Save Changes" onPress={saveEdit} size="lg" icon="check" style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{patient.name}</Text>
              <Text style={styles.profilePhone}>{patient.phone}</Text>
              <Text style={styles.profileSince}>
                Patient since {fmtDate(patient.createdAt)}
              </Text>
            </>
          )}
        </View>

        {!editing && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{patientApts.length}</Text>
                <Text style={styles.statLbl}>Total Visits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{completed}</Text>
                <Text style={styles.statLbl}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statNum, upcoming > 0 && { color: Colors.primary }]}>
                  {upcoming}
                </Text>
                <Text style={styles.statLbl}>Upcoming</Text>
              </View>
            </View>

            {patient.notes ? (
              <View style={styles.notesCard}>
                <View style={styles.notesHeader}>
                  <Feather name="file-text" size={14} color={Colors.text.muted} />
                  <Text style={styles.notesTitle}>Clinical Notes</Text>
                </View>
                <Text style={styles.notesText}>{patient.notes}</Text>
              </View>
            ) : null}

            <View style={styles.aptSection}>
              <View style={styles.aptSectionRow}>
                <Text style={styles.aptSectionTitle}>
                  Appointment History
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/appointments/book",
                      params: { patientId: patient.id },
                    })
                  }
                  style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Feather name="plus" size={13} color={Colors.primary} />
                  <Text style={styles.bookBtnText}>Book</Text>
                </Pressable>
              </View>

              {patientApts.length === 0 ? (
                <View style={styles.noApts}>
                  <Text style={styles.noAptsText}>No appointments yet</Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/appointments/book",
                        params: { patientId: patient.id },
                      })
                    }
                    style={({ pressed }) => [styles.bookFirstBtn, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Text style={styles.bookFirstBtnText}>Book First Appointment</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.aptList}>
                  {patientApts.map((apt) => (
                    <View key={apt.id} style={styles.aptCard}>
                      <View style={styles.aptLeft}>
                        <Text style={styles.aptDate}>{fmtDate(apt.date)}</Text>
                        <Text style={styles.aptTime}>{apt.time}</Text>
                      </View>
                      <View style={styles.aptMiddle}>
                        <Text style={styles.aptProblem} numberOfLines={2}>
                          {apt.problem}
                        </Text>
                        <StatusBadge status={apt.status} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="trash-2" size={14} color={Colors.status.cancelled} />
              <Text style={styles.deleteBtnText}>Delete Patient</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.text.muted },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: "0 3px 16px rgba(0,0,0,0.08)" },
    }),
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  profileAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.primary,
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text.primary,
  },
  profilePhone: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text.secondary,
  },
  profileSince: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  editForm: { width: "100%", gap: 12 },
  editField: { gap: 4 },
  editLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text.muted },
  editInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background.secondary,
  },
  editActions: { marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text.primary },
  statLbl: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.muted },
  notesCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  notesHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  notesTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text.secondary },
  notesText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text.primary, lineHeight: 20 },
  aptSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },
  aptSectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aptSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text.primary },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.primary },
  noApts: { alignItems: "center", gap: 12, paddingVertical: 16 },
  noAptsText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text.muted },
  bookFirstBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  bookFirstBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  aptList: { gap: 10 },
  aptCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  aptLeft: {
    width: 60,
    gap: 2,
    alignItems: "center",
  },
  aptDate: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text.secondary, textAlign: "center" },
  aptTime: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.primary, textAlign: "center" },
  aptMiddle: { flex: 1, gap: 6 },
  aptProblem: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.primary, lineHeight: 18 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.status.cancelledBg,
    backgroundColor: Colors.status.cancelledBg,
    marginTop: 4,
  },
  deleteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.status.cancelled },
});



