import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function EntryScreen() {
  const { isLoading, currentDentist } = useApp();
  const insets = useSafeAreaInsets();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (isLoading || redirected) return;
    if (currentDentist) {
      setRedirected(true);
      router.replace("/dashboard");
    }
  }, [isLoading, currentDentist, redirected]);

  if (isLoading || currentDentist) {
    return (
      <View style={styles.loader}>
        <View style={styles.logoCircle}>
          <Feather name="activity" size={28} color={Colors.primary} />
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 60 : insets.top + 40,
          paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32,
        },
      ]}
    >
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Feather name="activity" size={32} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.appName}>DentBook</Text>
        <Text style={styles.appTagline}>Your smile, expertly scheduled</Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/customer/home");
          }}
          style={({ pressed }) => [styles.card, styles.cardPatient, { opacity: pressed ? 0.95 : 1 }]}
        >
          <View style={[styles.cardIcon, { backgroundColor: Colors.primaryLight }]}>
            <Feather name="user" size={26} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: Colors.text.primary }]}>
              I'm a Patient
            </Text>
            <Text style={[styles.cardDesc, { color: Colors.text.secondary }]}>
              View clinic info, book appointments and download tickets
            </Text>
          </View>
          <View style={[styles.cardArrow, { backgroundColor: Colors.primaryLight }]}>
            <Feather name="arrow-right" size={18} color={Colors.primary} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/auth/login");
          }}
          style={({ pressed }) => [styles.card, styles.cardDentist, { opacity: pressed ? 0.95 : 1 }]}
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="clipboard" size={26} color="#fff" />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: "#fff" }]}>
              I'm a Dentist
            </Text>
            <Text style={[styles.cardDesc, { color: "rgba(255,255,255,0.8)" }]}>
              Manage patients, appointments, schedule and analytics
            </Text>
          </View>
          <View style={[styles.cardArrow, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="arrow-right" size={18} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerPill}>
          <Feather name="shield" size={12} color={Colors.text.muted} />
          <Text style={styles.footerText}>Secure · Private · No account needed for patients</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    gap: 10,
  },
  logoWrap: { marginBottom: 4 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 6 },
      web: { boxShadow: `0 6px 20px ${Colors.primary}30` },
    }),
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.text.muted,
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 5 },
      web: { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
    }),
  },
  cardPatient: {
    backgroundColor: Colors.white,
  },
  cardDentist: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  footer: {
    alignItems: "center",
  },
  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.text.muted,
  },
});
