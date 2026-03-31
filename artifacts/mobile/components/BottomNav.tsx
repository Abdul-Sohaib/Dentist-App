import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const TABS = [
  { label: "Home", icon: "home" as const, path: "/dashboard" },
  { label: "Patients", icon: "users" as const, path: "/patients" },
  { label: "Appointments", icon: "calendar" as const, path: "/appointments" },
  { label: "Analytics", icon: "bar-chart-2" as const, path: "/analytics" },
  { label: "Settings", icon: "settings" as const, path: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {TABS.map((tab) => {
        const active = pathname === tab.path || pathname.startsWith(tab.path + "/");
        return (
          <Pressable
            key={tab.path}
            onPress={() => router.replace(tab.path as any)}
            style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Feather
                name={tab.icon}
                size={20}
                color={active ? Colors.primary : Colors.text.muted}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" },
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingBottom: 4,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryLight,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.text.muted,
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
