import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  ensureAppointmentAlertsChannel,
  type NotificationPermissionStatus,
} from "./nativeNotifications";

export async function registerExpoPushTokenAsync(): Promise<{
  expoPushToken: string | null;
  permission: NotificationPermissionStatus;
}> {
  if (Platform.OS === "web" || !Device.isDevice) {
    return { expoPushToken: null, permission: "unknown" };
  }

  await ensureAppointmentAlertsChannel();

  const current = (await Notifications.getPermissionsAsync()) as any;
  let status = current.status;

  if (status !== "granted") {
    const requested = (await Notifications.requestPermissionsAsync()) as any;
    status = requested.status;
  }

  if (status !== "granted") {
    return { expoPushToken: null, permission: status === "denied" ? "denied" : "unknown" };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Expo project ID is missing");
  }

  return {
    expoPushToken: (await Notifications.getExpoPushTokenAsync({ projectId })).data,
    permission: "granted",
  };
}
