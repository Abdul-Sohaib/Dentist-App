import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function IndexScreen() {
  const { isLoading, currentDentist } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (currentDentist) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [isLoading, currentDentist]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
});
