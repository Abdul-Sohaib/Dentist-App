import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
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
import { Button, Input } from "@/components/UI";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

export default function BookAppointmentScreen() {
  const { patientId: paramPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const { patients, addAppointment, getAvailableSlots, currentDentist } = useApp();
  const insets = useSafeAreaInsets();

  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId ?? "");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientPicker, setShowPatientPicker] = useState(!paramPatientId);
  const [problem, setProblem] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [bookingMode, setBookingMode] = useState<"pending" | "confirmed">("pending");

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/appointments");
  };

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q)
    );
  }, [patients, patientSearch]);

  const calDays = useMemo(
    () => getCalendarDays(calYear, calMonth),
    [calYear, calMonth]
  );

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    let mounted = true;

    (async () => {
      setSlotsLoading(true);
      try {
        const slots = await getAvailableSlots(selectedDate);
        if (mounted) setAvailableSlots(slots);
      } finally {
        if (mounted) setSlotsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedDate, getAvailableSlots]);

  const isWorkingDay = (date: Date): boolean => {
    if (!currentDentist) return false;
    return currentDentist.workingDays.includes(date.getDay());
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedPatientId) e.patient = "Select a patient";
    if (!selectedDate) e.date = "Select a date";
    if (!selectedTime) e.time = "Select a time slot";
    if (!problem.trim()) e.problem = "Reason for visit is required";
    if (patientAge.trim() && Number.isNaN(Number(patientAge))) e.age = "Age must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const apt = await addAppointment({
      patientId: selectedPatientId,
      date: selectedDate,
      time: selectedTime,
      problem: problem.trim(),
      status: bookingMode,
    });
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/appointments/success", params: { appointmentId: apt.id } });
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDate(""); setSelectedTime("");
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDate(""); setSelectedTime("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.secondary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.headerBar, { paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="arrow-left" size={20} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient</Text>

          {selectedPatient && !showPatientPicker ? (
            <View style={styles.selectedPatientRow}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {selectedPatient.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{selectedPatient.name}</Text>
                <Text style={styles.patientPhone}>{selectedPatient.phone}</Text>
              </View>
              <Pressable
                onPress={() => setShowPatientPicker(true)}
                style={({ pressed }) => [styles.changeBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <View style={styles.patientSearchRow}>
                <Feather name="search" size={14} color={Colors.text.muted} />
                <TextInput
                  style={styles.patientSearchInput}
                  placeholder="Search patients..."
                  placeholderTextColor={Colors.text.muted}
                  value={patientSearch}
                  onChangeText={setPatientSearch}
                />
              </View>
              {filteredPatients.length === 0 ? (
                <View style={styles.noPatients}>
                  <Text style={styles.noPatientsText}>No patients found</Text>
                  <Pressable onPress={() => router.push("/patients/add")} style={styles.addPatientLink}>
                    <Text style={styles.addPatientLinkText}>+ Add a new patient</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.patientList}>
                  {filteredPatients.slice(0, 6).map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setSelectedPatientId(p.id);
                        setShowPatientPicker(false);
                        setPatientSearch("");
                        setErrors((e) => ({ ...e, patient: "" }));
                        Haptics.selectionAsync();
                      }}
                      style={({ pressed }) => [styles.patientItem, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <View style={styles.patientItemAvatar}>
                        <Text style={styles.patientItemAvatarText}>
                          {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.patientItemName}>{p.name}</Text>
                        <Text style={styles.patientItemPhone}>{p.phone}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              {errors.patient ? <Text style={styles.errText}>{errors.patient}</Text> : null}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Date</Text>
          <View style={styles.calHeader}>
            <Pressable onPress={prevMonth} style={styles.calNavBtn}>
              <Feather name="chevron-left" size={18} color={Colors.text.primary} />
            </Pressable>
            <Text style={styles.calMonthTitle}>
              {MONTHS_LONG[calMonth]} {calYear}
            </Text>
            <Pressable onPress={nextMonth} style={styles.calNavBtn}>
              <Feather name="chevron-right" size={18} color={Colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.calGrid}>
            {DAYS_SHORT.map((d) => (
              <Text key={d} style={styles.calDayLabel}>{d}</Text>
            ))}
            {calDays.map((date, i) => {
              if (!date) return <View key={`empty-${i}`} style={styles.calCell} />;
              const ds = toDateStr(date);
              const isPast = ds < todayStr();
              const isWorking = isWorkingDay(date);
              const isSelected = ds === selectedDate;
              const isToday = ds === todayStr();
              const disabled = isPast || !isWorking;
              return (
                <Pressable
                  key={ds}
                  onPress={() => {
                    if (disabled) return;
                    setSelectedDate(ds);
                    setSelectedTime("");
                    setErrors((e) => ({ ...e, date: "" }));
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.calCell,
                    isSelected && styles.calCellSelected,
                    isToday && !isSelected && styles.calCellToday,
                    disabled && styles.calCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.calCellText,
                      isSelected && styles.calCellTextSelected,
                      disabled && styles.calCellTextDisabled,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.date ? <Text style={styles.errText}>{errors.date}</Text> : null}
        </View>

        {selectedDate ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Time</Text>
            {slotsLoading ? (
              <View style={styles.noSlots}>
                <Feather name="loader" size={20} color={Colors.text.muted} />
                <Text style={styles.noSlotsText}>Loading available slots...</Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlots}>
                <Feather name="clock" size={20} color={Colors.text.muted} />
                <Text style={styles.noSlotsText}>No slots available for this date</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => {
                      setSelectedTime(slot);
                      setErrors((e) => ({ ...e, time: "" }));
                      Haptics.selectionAsync();
                    }}
                    style={[styles.slotBtn, selectedTime === slot && styles.slotBtnSelected]}
                  >
                    <Text style={[styles.slotText, selectedTime === slot && styles.slotTextSelected]}>
                      {slot}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {errors.time ? <Text style={styles.errText}>{errors.time}</Text> : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reason for Visit</Text>
          <Input
            icon="file-text"
            placeholder="Describe the problem or treatment..."
            value={problem}
            onChangeText={(t) => { setProblem(t); setErrors((e) => ({ ...e, problem: "" })); }}
            error={errors.problem}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Input
            icon="hash"
            label="Patient Age"
            placeholder="Optional"
            value={patientAge}
            onChangeText={(t) => { setPatientAge(t); setErrors((e) => ({ ...e, age: "" })); }}
            error={errors.age}
            keyboardType="number-pad"
          />
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setBookingMode("pending")}
              style={[styles.modeBtn, bookingMode === "pending" && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, bookingMode === "pending" && styles.modeTextActive]}>
                Book
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBookingMode("confirmed")}
              style={[styles.modeBtn, bookingMode === "confirmed" && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, bookingMode === "confirmed" && styles.modeTextActive]}>
                Reserve
              </Text>
            </Pressable>
          </View>
        </View>

        <Button
          label="Book Appointment"
          onPress={handleBook}
          loading={loading}
          size="lg"
          icon="calendar"
          style={styles.bookBtn}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background.secondary,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.text.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.border, gap: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
    }),
  },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text.primary },
  selectedPatientRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  patientAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
  patientAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.primary },
  patientName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text.primary },
  patientPhone: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.text.muted },
  changeBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 8,
  },
  changeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.primary },
  patientSearchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.background.secondary, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 10,
  },
  patientSearchInput: {
    flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text.primary,
  },
  noPatients: { alignItems: "center", gap: 8, paddingVertical: 16 },
  noPatientsText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text.muted },
  addPatientLink: { padding: 4 },
  addPatientLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  patientList: { gap: 2 },
  patientItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 10,
  },
  patientItemAvatar: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
  patientItemAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.primary },
  patientItemName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text.primary },
  patientItemPhone: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.muted },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  calNavBtn: { padding: 8 },
  calMonthTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text.primary },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calDayLabel: {
    width: "14.28%", textAlign: "center",
    fontFamily: "Inter_500Medium", fontSize: 11,
    color: Colors.text.muted, paddingBottom: 8,
  },
  calCell: {
    width: "14.28%", aspectRatio: 1,
    alignItems: "center", justifyContent: "center",
    borderRadius: 8,
  },
  calCellSelected: { backgroundColor: Colors.primary },
  calCellToday: { backgroundColor: Colors.primaryLight },
  calCellDisabled: { opacity: 0.3 },
  calCellText: {
    fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text.primary,
  },
  calCellTextSelected: { color: Colors.white, fontFamily: "Inter_700Bold" },
  calCellTextDisabled: { color: Colors.text.muted },
  noSlots: { alignItems: "center", gap: 8, paddingVertical: 16 },
  noSlotsText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text.muted },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 10, backgroundColor: Colors.background.secondary,
    borderWidth: 1, borderColor: Colors.border,
  },
  slotBtnSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text.primary },
  slotTextSelected: { color: Colors.white, fontFamily: "Inter_600SemiBold" },
  errText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.status.cancelled },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background.secondary,
  },
  modeBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  modeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text.secondary },
  modeTextActive: { color: Colors.primary },
  bookBtn: { marginTop: 4 },
});



