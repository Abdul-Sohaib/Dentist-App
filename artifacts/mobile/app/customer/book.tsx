import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function buildCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  return cells;
}

function toLocalISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CustomerBook() {
  const { clinicProfile, getAvailableSlots, bookAsCustomer, currentCustomer } = useApp();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookFor, setBookFor] = useState<"self" | "other">("self");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issueMedia, setIssueMedia] = useState<
    { kind: "photo" | "video"; dataUri: string; label: string }[]
  >([]);

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!currentCustomer) {
      router.replace("/customer/auth/login");
      return;
    }
    setName(currentCustomer.name);
    setPhone(currentCustomer.phone);
  }, [currentCustomer]);

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

  const todayISO = toLocalISO(today);
  const canGoBack = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  function prevMonth() {
    if (!canGoBack) return;
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  function isWorkingDay(iso: string | null) {
    if (!iso) return false;
    const d = new Date(iso + "T00:00:00");
    return clinicProfile.workingDays.includes(d.getDay());
  }

  function isPast(iso: string | null) {
    if (!iso) return false;
    return iso < todayISO;
  }

  const currentName = bookFor === "self" ? currentCustomer?.name ?? "" : name.trim();
  const currentPhone = bookFor === "self" ? currentCustomer?.phone ?? "" : phone.trim();
  const canBook = selectedDate && selectedSlot && currentName && currentPhone && problem.trim();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/customer/home");
  };

  async function handleBook() {
    if (!currentCustomer) {
      router.replace("/customer/auth/login");
      return;
    }
    if (!canBook) return;
    if (currentPhone.replace(/\D/g, "").length < 7) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return;
    }
    if (age.trim() && Number.isNaN(Number(age))) {
      Alert.alert("Invalid Age", "Please enter a valid age.");
      return;
    }
    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const apt = await bookAsCustomer({
        patientName: currentName,
        phone: currentPhone,
        age: age.trim() ? Number(age) : undefined,
        problem: problem.trim(),
        date: selectedDate!,
        time: selectedSlot!,
        bookFor,
        issueMedia: issueMedia.map((item) => ({ kind: item.kind, dataUri: item.dataUri })),
      });
      router.replace({
        pathname: "/customer/success",
        params: {
          appointmentId: apt.id,
          ticketId: apt.ticketId ?? "",
          date: selectedDate!,
          time: selectedSlot!,
          patientName: currentName,
          phone: currentPhone,
          problem: problem.trim(),
          clinicName: clinicProfile.clinicName,
          doctorName: clinicProfile.name,
          location: clinicProfile.location,
        },
      });
    } catch (e) {
      Alert.alert("Error", "Could not book. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function pickIssueMedia(kind: "photo" | "video") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === "photo" ? ["images"] : ["videos"],
      allowsMultipleSelection: false,
      base64: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Selection failed", "Unable to read the selected file.");
      return;
    }
    const mime = asset.mimeType ?? (kind === "photo" ? "image/jpeg" : "video/mp4");
    setIssueMedia((prev) => [
      ...prev,
      {
        kind,
        dataUri: `data:${mime};base64,${asset.base64}`,
        label: kind === "photo" ? "Photo attached" : "Video attached",
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Platform.OS === "web" ? 0 : insets.top,
              paddingBottom: (Platform.OS === "web" ? 20 : insets.bottom) + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="arrow-left" size={20} color={Colors.text.primary} />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Book Appointment</Text>
              <Text style={styles.headerSub}>{clinicProfile.clinicName}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.sectionTitle}>Select a Date</Text>
            </View>

            <View style={styles.calHeader}>
              <Pressable
                onPress={prevMonth}
                disabled={!canGoBack}
                style={({ pressed }) => [styles.calNavBtn, { opacity: !canGoBack ? 0.3 : pressed ? 0.7 : 1 }]}
              >
                <Feather name="chevron-left" size={18} color={Colors.text.primary} />
              </Pressable>
              <Text style={styles.calMonthLabel}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={nextMonth}
                style={({ pressed }) => [styles.calNavBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Feather name="chevron-right" size={18} color={Colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.calWeek}>
              {DAY_NAMES.map((d) => (
                <Text key={d} style={styles.calWeekLabel}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {cells.map((iso, i) => {
                if (!iso) return <View key={`empty-${i}`} style={styles.calCell} />;
                const working = isWorkingDay(iso);
                const past = isPast(iso);
                const disabled = !working || past;
                const selected = iso === selectedDate;
                const isToday = iso === todayISO;

                return (
                  <Pressable
                    key={iso}
                    onPress={() => {
                      if (disabled) return;
                      Haptics.selectionAsync();
                      setSelectedDate(iso);
                      setSelectedSlot(null);
                    }}
                    style={[
                      styles.calCell,
                      selected && styles.calCellSelected,
                      isToday && !selected && styles.calCellToday,
                      disabled && styles.calCellDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calCellText,
                        selected && styles.calCellTextSelected,
                        disabled && styles.calCellTextDisabled,
                        isToday && !selected && styles.calCellTextToday,
                      ]}
                    >
                      {new Date(iso + "T00:00:00").getDate()}
                    </Text>
                    {working && !past && !selected && (
                      <View style={styles.calDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {selectedDate && (
              <View style={styles.selectedDateLabel}>
                <Feather name="check-circle" size={14} color={Colors.secondary} />
                <Text style={styles.selectedDateText}>{formatDateLabel(selectedDate)}</Text>
              </View>
            )}
          </View>

          {selectedDate && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
                <Text style={styles.sectionTitle}>Pick a Time</Text>
              </View>
              {slotsLoading ? (
                <View style={styles.noSlots}>
                  <Feather name="loader" size={24} color={Colors.text.muted} />
                  <Text style={styles.noSlotsText}>Loading available slots...</Text>
                  <Text style={styles.noSlotsHint}>Please wait a moment</Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlots}>
                  <Feather name="clock" size={24} color={Colors.text.muted} />
                  <Text style={styles.noSlotsText}>No available slots for this day</Text>
                  <Text style={styles.noSlotsHint}>Please choose a different date</Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => { Haptics.selectionAsync(); setSelectedSlot(slot); }}
                      style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnSelected]}
                    >
                      <Text
                        style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}
                      >
                        {formatTime(slot)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {selectedDate && selectedSlot && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
                <Text style={styles.sectionTitle}>Your Details</Text>
              </View>

              <View style={styles.bookingTypeRow}>
                <Pressable
                  onPress={() => setBookFor("self")}
                  style={[styles.bookingTypeBtn, bookFor === "self" && styles.bookingTypeBtnActive]}
                >
                  <Text style={[styles.bookingTypeText, bookFor === "self" && styles.bookingTypeTextActive]}>
                    Book for Me
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBookFor("other")}
                  style={[styles.bookingTypeBtn, bookFor === "other" && styles.bookingTypeBtnActive]}
                >
                  <Text style={[styles.bookingTypeText, bookFor === "other" && styles.bookingTypeTextActive]}>
                    Book for Another
                  </Text>
                </Pressable>
              </View>

              {bookFor === "self" ? (
                <View style={styles.selfBox}>
                  <Text style={styles.selfText}>Name: {currentCustomer?.name ?? "-"}</Text>
                  <Text style={styles.selfText}>Phone: {currentCustomer?.phone ?? "-"}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.formField}>
                    <Text style={styles.label}>Patient Name</Text>
                    <View style={styles.inputWrap}>
                      <Feather name="user" size={16} color={Colors.text.muted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter patient full name"
                        placeholderTextColor={Colors.text.muted}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.label}>Patient Phone</Text>
                    <View style={styles.inputWrap}>
                      <Feather name="phone" size={16} color={Colors.text.muted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+1 (555) 000-0000"
                        placeholderTextColor={Colors.text.muted}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.formField}>
                <Text style={styles.label}>Age</Text>
                <View style={styles.inputWrap}>
                  <Feather name="hash" size={16} color={Colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    placeholder="Optional"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Reason / Symptoms</Text>
                <View style={[styles.inputWrap, styles.textAreaWrap]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={problem}
                    onChangeText={setProblem}
                    placeholder="Describe your symptoms or reason for visit..."
                    placeholderTextColor={Colors.text.muted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Issue Media (Optional)</Text>
                <View style={styles.bookingTypeRow}>
                  <Pressable style={styles.bookingTypeBtn} onPress={() => pickIssueMedia("photo")}>
                    <Text style={styles.bookingTypeText}>Add Photo</Text>
                  </Pressable>
                  <Pressable style={styles.bookingTypeBtn} onPress={() => pickIssueMedia("video")}>
                    <Text style={styles.bookingTypeText}>Add Video</Text>
                  </Pressable>
                </View>
                {issueMedia.length > 0 ? (
                  <View style={styles.mediaList}>
                    {issueMedia.map((item, index) => (
                      <View key={`${item.kind}-${index}`} style={styles.mediaRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selfText}>{item.label}</Text>
                          {item.kind === "video" ? (
                            <Text style={styles.mediaHint}>Will play inside the app after upload</Text>
                          ) : null}
                        </View>
                        <Pressable onPress={() => setIssueMedia((prev) => prev.filter((_, i) => i !== index))}>
                          <Text style={styles.linkRemove}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {selectedDate && selectedSlot && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Feather name="user" size={14} color={Colors.text.muted} />
                <Text style={styles.summaryLabel}>Doctor</Text>
                <Text style={styles.summaryValue}>{clinicProfile.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="calendar" size={14} color={Colors.text.muted} />
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{formatDateLabel(selectedDate)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="clock" size={14} color={Colors.text.muted} />
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{formatTime(selectedSlot)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="user" size={14} color={Colors.text.muted} />
                <Text style={styles.summaryLabel}>For</Text>
                <Text style={styles.summaryValue}>{currentName}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 12 },
          ]}
        >
          <Pressable
            onPress={handleBook}
            disabled={!canBook || submitting}
            style={({ pressed }) => [
              styles.bookBtn,
              (!canBook || submitting) && styles.bookBtnDisabled,
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.bookBtnText}>
              {submitting ? "Booking..." : "Confirm Appointment"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.secondary },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
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
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
    textAlign: "center",
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: 1,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    }),
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text.primary },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  calMonthLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text.primary,
  },
  calWeek: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  calWeekLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text.muted,
    width: 36,
    textAlign: "center",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  calCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    position: "relative",
    paddingBottom: 4,
  },
  calCellSelected: { backgroundColor: Colors.primary },
  calCellToday: { borderWidth: 1.5, borderColor: Colors.primary },
  calCellDisabled: { opacity: 0.35 },
  calCellText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text.primary,
  },
  calCellTextSelected: { color: "#fff", fontFamily: "Inter_700Bold" },
  calCellTextDisabled: { color: Colors.text.muted },
  calCellTextToday: { color: Colors.primary, fontFamily: "Inter_700Bold" },
  calDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  selectedDateLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary + "15",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedDateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.secondary,
  },
  noSlots: { alignItems: "center", gap: 6, paddingVertical: 16 },
  noSlotsText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text.secondary },
  noSlotsHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text.muted },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  slotBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text.secondary },
  slotTextSelected: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  formField: { gap: 6 },
  bookingTypeRow: { flexDirection: "row", gap: 8 },
  bookingTypeBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
  },
  bookingTypeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  bookingTypeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text.secondary },
  bookingTypeTextActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  selfBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    backgroundColor: Colors.background.secondary,
  },
  mediaList: { gap: 8 },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.background.secondary,
  },
  selfText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text.secondary },
  mediaHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  linkRemove: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.status.cancelled },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text.secondary },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  textAreaWrap: { alignItems: "flex-start", paddingTop: 12, minHeight: 96 },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  textArea: { minHeight: 72 },
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.primary, marginBottom: 2 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text.muted, width: 52 },
  summaryValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text.primary, flex: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(248,250,252,0.96)",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 8 },
      web: { boxShadow: `0 6px 20px ${Colors.primary}55` },
    }),
  },
  bookBtnDisabled: {
    backgroundColor: Colors.border,
    ...Platform.select({
      web: { boxShadow: "none" },
      default: {},
    }),
  },
  bookBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
});



