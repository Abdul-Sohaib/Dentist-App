import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function EntryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleCustomer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/customer/dentists");
  };

  const handleDentist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/dentist/login");
  };

  return (
    <View
      style={[styles.container, { paddingTop: topPad + 20 }]}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Feather name="activity" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>DentBook</Text>
        <Text style={styles.tagline}>
          Your smile, expertly scheduled
        </Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          onPress={handleCustomer}
          style={({ pressed }) => [
            styles.roleCard,
            styles.customerCard,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.roleIconBg}>
            <Feather name="user" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.roleTitle}>I'm a Patient</Text>
          <Text style={styles.roleDesc}>
            Find dentists, check availability, and book appointments in minutes
          </Text>
          <View style={styles.roleArrow}>
            <Feather name="arrow-right" size={18} color={Colors.primary} />
          </View>
        </Pressable>

        <Pressable
          onPress={handleDentist}
          style={({ pressed }) => [
            styles.roleCard,
            styles.dentistCard,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={[styles.roleIconBg, styles.dentistIconBg]}>
            <Feather name="clipboard" size={28} color={Colors.secondary} />
          </View>
          <Text style={[styles.roleTitle, styles.dentistTitle]}>I'm a Dentist</Text>
          <Text style={[styles.roleDesc, styles.dentistDesc]}>
            Manage your schedule, appointments, and patient bookings
          </Text>
          <View style={[styles.roleArrow, styles.dentistArrow]}>
            <Feather name="arrow-right" size={18} color={Colors.secondary} />
          </View>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Trusted by 2,000+ patients</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  cards: {
    gap: 16,
  },
  roleCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  dentistCard: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  roleIconBg: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  dentistIconBg: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  roleTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  dentistTitle: {
    color: "#fff",
  },
  roleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  dentistDesc: {
    color: "rgba(255,255,255,0.85)",
  },
  roleArrow: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dentistArrow: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text.muted,
  },
});
