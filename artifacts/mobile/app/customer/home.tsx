import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name="star"
          size={14}
          color={s <= Math.round(rating) ? "#F59E0B" : Colors.border}
        />
      ))}
      <Text style={starStyles.label}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const starStyles = StyleSheet.create({
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#F59E0B",
    marginLeft: 4,
  },
});

function InfoRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>
        <Feather name={icon} size={14} color={Colors.primary} />
      </View>
      <Text style={infoStyles.text}>{text}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});

export default function CustomerHome() {
  const { clinicProfile } = useApp();
  const insets = useSafeAreaInsets();

  const workingDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const workDays = clinicProfile.workingDays.map((d) => workingDayNames[d]).join(", ");
  const hoursText = `${clinicProfile.workingHours.start} – ${clinicProfile.workingHours.end}`;

  return (
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
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={20} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Dental Clinic</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Feather name="user" size={36} color={Colors.primary} />
            </View>
            <View style={styles.activeIndicator} />
          </View>

          <Text style={styles.doctorName}>{clinicProfile.name}</Text>
          <Text style={styles.clinicName}>{clinicProfile.clinicName}</Text>

          {clinicProfile.specialty ? (
            <View style={styles.specialtyPill}>
              <Feather name="award" size={12} color={Colors.secondary} />
              <Text style={styles.specialtyText}>{clinicProfile.specialty}</Text>
            </View>
          ) : null}

          {clinicProfile.rating ? (
            <View style={{ marginTop: 10 }}>
              <Stars rating={clinicProfile.rating} />
            </View>
          ) : null}

          {clinicProfile.experience ? (
            <View style={styles.expBadge}>
              <Text style={styles.expText}>
                {clinicProfile.experience}+ years experience
              </Text>
            </View>
          ) : null}
        </View>

        {clinicProfile.bio ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.bioText}>{clinicProfile.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Clinic Information</Text>
          </View>
          <View style={styles.infoList}>
            <InfoRow icon="map-pin" text={clinicProfile.location} />
            <InfoRow icon="phone" text={clinicProfile.phone} />
            <InfoRow icon="clock" text={`${hoursText} · ${workDays}`} />
            <InfoRow icon="calendar" text={`${clinicProfile.slotDuration}-min appointment slots`} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="check-circle" size={16} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Why Choose Us</Text>
          </View>
          <View style={styles.featureList}>
            {[
              { icon: "shield" as const, text: "Certified & experienced dentist" },
              { icon: "clock" as const, text: "On-time appointments guaranteed" },
              { icon: "heart" as const, text: "Gentle, patient-first care" },
              { icon: "zap" as const, text: "Modern equipment & techniques" },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Feather name={f.icon} size={14} color={Colors.secondary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.ctaWrap,
          {
            paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push("/customer/book")}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.92 : 1 }]}
        >
          <Feather name="calendar" size={20} color="#fff" />
          <Text style={styles.ctaBtnText}>Book Appointment</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 6 },
      web: { boxShadow: `0 8px 32px ${Colors.primary}18` },
    }),
  },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary + "40",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  doctorName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text.primary,
    textAlign: "center",
  },
  clinicName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 2,
  },
  specialtyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.secondary + "15",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  specialtyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.secondary,
  },
  expBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },
  expText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text.primary,
  },
  bioText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  infoList: { gap: 12 },
  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
  },
  ctaWrap: {
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
  ctaBtn: {
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
  ctaBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
});
