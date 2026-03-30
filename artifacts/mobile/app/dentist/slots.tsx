import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { Button } from "@/components/UI";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

export default function SlotsManagementScreen() {
  const { currentDentist, updateDentistProfile } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [startTime, setStartTime] = useState(
    currentDentist?.workingHours.start ?? "09:00"
  );
  const [endTime, setEndTime] = useState(
    currentDentist?.workingHours.end ?? "17:00"
  );
  const [workingDays, setWorkingDays] = useState<number[]>(
    currentDentist?.workingDays ?? [1, 2, 3, 4, 5]
  );
  const [slotDuration, setSlotDuration] = useState(
    currentDentist?.slotDuration ?? 30
  );
  const [breaks, setBreaks] = useState<{ start: string; end: string }[]>(
    currentDentist?.breaks ?? []
  );
  const [newBreakStart, setNewBreakStart] = useState("13:00");
  const [newBreakEnd, setNewBreakEnd] = useState("14:00");
  const [saved, setSaved] = useState(false);

  if (!currentDentist) {
    router.replace("/dentist/login");
    return null;
  }

  const toggleDay = (day: number) => {
    Haptics.selectionAsync();
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBreaks((prev) => [...prev, { start: newBreakStart, end: newBreakEnd }]);
    setNewBreakStart("13:00");
    setNewBreakEnd("14:00");
  };

  const removeBreak = (i: number) => {
    setBreaks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    updateDentistProfile(currentDentist.id, {
      workingHours: { start: startTime, end: endTime },
      workingDays,
      slotDuration,
      breaks,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Slot Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={Colors.text.muted}
              />
            </View>
            <View style={styles.timeDash}>
              <Feather name="arrow-right" size={16} color={Colors.text.muted} />
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>End Time</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
                placeholderTextColor={Colors.text.muted}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Days</Text>
          <View style={styles.daysRow}>
            {DAY_NAMES.map((day, i) => (
              <Pressable
                key={i}
                onPress={() => toggleDay(i)}
                style={[
                  styles.dayBtn,
                  workingDays.includes(i) && styles.dayBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayBtnText,
                    workingDays.includes(i) && styles.dayBtnTextActive,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Duration</Text>
          <View style={styles.durationRow}>
            {SLOT_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  setSlotDuration(opt);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.durationBtn,
                  slotDuration === opt && styles.durationBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.durationBtnText,
                    slotDuration === opt && styles.durationBtnTextActive,
                  ]}
                >
                  {opt}m
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Break Times</Text>

          {breaks.map((b, i) => (
            <View key={i} style={styles.breakRow}>
              <Feather name="coffee" size={15} color={Colors.text.muted} />
              <Text style={styles.breakText}>
                {b.start} – {b.end}
              </Text>
              <Pressable onPress={() => removeBreak(i)} style={styles.removeBreak}>
                <Feather name="x" size={15} color={Colors.status.rejected} />
              </Pressable>
            </View>
          ))}

          <View style={styles.addBreakRow}>
            <View style={styles.timeBoxSmall}>
              <Text style={styles.timeLabel}>From</Text>
              <TextInput
                style={styles.timeInputSmall}
                value={newBreakStart}
                onChangeText={setNewBreakStart}
                placeholder="13:00"
                placeholderTextColor={Colors.text.muted}
              />
            </View>
            <View style={styles.timeDash}>
              <Feather name="arrow-right" size={14} color={Colors.text.muted} />
            </View>
            <View style={styles.timeBoxSmall}>
              <Text style={styles.timeLabel}>To</Text>
              <TextInput
                style={styles.timeInputSmall}
                value={newBreakEnd}
                onChangeText={setNewBreakEnd}
                placeholder="14:00"
                placeholderTextColor={Colors.text.muted}
              />
            </View>
            <Pressable onPress={addBreak} style={styles.addBreakBtn}>
              <Feather name="plus" size={16} color={Colors.white} />
              <Text style={styles.addBreakBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.saveWrapper}>
          <Button
            label={saved ? "Saved!" : "Save Changes"}
            onPress={handleSave}
            variant={saved ? "secondary" : "primary"}
          />
        </View>

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
      </ScrollView>
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeBox: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.text.muted,
  },
  timeInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text.primary,
    textAlign: "center",
  },
  timeDash: {
    paddingTop: 20,
    alignItems: "center",
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text.secondary,
  },
  dayBtnTextActive: {
    color: "#fff",
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  durationBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  durationBtnTextActive: {
    color: "#fff",
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: 12,
  },
  breakText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  removeBreak: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.status.rejectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  addBreakRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  timeBoxSmall: {
    flex: 1,
    gap: 5,
  },
  timeInputSmall: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text.primary,
    textAlign: "center",
  },
  addBreakBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 1,
  },
  addBreakBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.white,
  },
  saveWrapper: {},
});
