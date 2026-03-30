import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function DentistProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dentists, getAvailableSlots } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const dentist = useMemo(
    () => dentists.find((d) => d.id === id),
    [dentists, id]
  );

  const next14 = useMemo(() => getNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(next14[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const slots = useMemo(
    () => (dentist ? getAvailableSlots(dentist.id, formatDate(selectedDate)) : []),
    [dentist, selectedDate, getAvailableSlots]
  );

  if (!dentist) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: Colors.text.muted }}>Dentist not found</Text>
      </View>
    );
  }

  const initials = dentist.name
    .replace("Dr. ", "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const handleProceed = () => {
    if (!selectedSlot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/customer/booking",
      params: {
        dentistId: dentist.id,
        date: formatDate(selectedDate),
        time: selectedSlot,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Dentist Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{dentist.name}</Text>
          <Text style={styles.profileSpecialty}>{dentist.specialty}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="star" size={16} color="#F59E0B" />
              <Text style={styles.statValue}>{dentist.rating}</Text>
              <Text style={styles.statLabel}>{dentist.reviewCount} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="briefcase" size={16} color={Colors.primary} />
              <Text style={styles.statValue}>{dentist.experience}</Text>
              <Text style={styles.statLabel}>yrs exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Feather name="clock" size={16} color={Colors.secondary} />
              <Text style={styles.statValue}>{dentist.slotDuration}m</Text>
              <Text style={styles.statLabel}>per visit</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={15} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>{dentist.clinic}</Text>
              <Text style={styles.infoValue}>{dentist.location}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Feather name="clock" size={15} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Working Hours</Text>
              <Text style={styles.infoValue}>
                {dentist.workingHours.start} – {dentist.workingHours.end}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Feather name="calendar" size={15} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Working Days</Text>
              <Text style={styles.infoValue}>
                {dentist.workingDays.map((d) => DAYS[d]).join(", ")}
              </Text>
            </View>
          </View>
          {dentist.bio ? (
            <Text style={styles.bio}>{dentist.bio}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Select a Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {next14.map((date, i) => {
            const isSelected = formatDate(date) === formatDate(selectedDate);
            const isWorking = dentist.workingDays.includes(date.getDay());
            return (
              <Pressable
                key={i}
                onPress={() => {
                  if (!isWorking) return;
                  setSelectedDate(date);
                  setSelectedSlot(null);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                  !isWorking && styles.dateCardDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.dateDay,
                    isSelected && styles.dateDaySelected,
                    !isWorking && styles.dateDayDisabled,
                  ]}
                >
                  {DAYS[date.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dateNumSelected,
                    !isWorking && styles.dateNumDisabled,
                  ]}
                >
                  {date.getDate()}
                </Text>
                <Text
                  style={[
                    styles.dateMon,
                    isSelected && styles.dateMonSelected,
                    !isWorking && styles.dateMonDisabled,
                  ]}
                >
                  {MONTHS[date.getMonth()]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>
          Available Slots{" "}
          {slots.length > 0 ? (
            <Text style={styles.slotCount}>({slots.length} open)</Text>
          ) : null}
        </Text>

        {slots.length === 0 ? (
          <View style={styles.noSlots}>
            <Feather name="calendar" size={32} color={Colors.border} />
            <Text style={styles.noSlotsText}>No slots available on this day</Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => {
                    setSelectedSlot(slot);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.slotBtn,
                    isSelected && styles.slotBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotText,
                      isSelected && styles.slotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedSlot && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>Selected</Text>
            <Text style={styles.selectedValue}>
              {DAYS[selectedDate.getDay()]}, {selectedDate.getDate()}{" "}
              {MONTHS[selectedDate.getMonth()]} at {selectedSlot}
            </Text>
          </View>
          <Pressable
            onPress={handleProceed}
            style={({ pressed }) => [
              styles.proceedBtn,
              { opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Text style={styles.proceedBtnText}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
  web: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
});

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
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...cardShadow,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  profileAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.primary,
  },
  profileName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  profileSpecialty: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.text.muted,
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text.primary,
  },
  infoValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  slotCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.muted,
  },
  dateScroll: {
    paddingRight: 20,
    gap: 10,
    marginBottom: 24,
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateCardDisabled: {
    opacity: 0.35,
  },
  dateDay: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.text.muted,
    textTransform: "uppercase",
  },
  dateDaySelected: { color: "rgba(255,255,255,0.8)" },
  dateDayDisabled: {},
  dateNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text.primary,
  },
  dateNumSelected: { color: "#fff" },
  dateNumDisabled: {},
  dateMon: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.text.muted,
  },
  dateMonSelected: { color: "rgba(255,255,255,0.8)" },
  dateMonDisabled: {},
  noSlots: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  noSlotsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.muted,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  slotBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotBtnSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  slotText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  slotTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 14,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.text.muted,
  },
  selectedValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text.primary,
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  proceedBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
