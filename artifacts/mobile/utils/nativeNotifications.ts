import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type NotificationPermissionStatus = "unknown" | "granted" | "denied";

const isNativeMobile = Platform.OS === "ios" || Platform.OS === "android";
let handlerConfigured = false;
let channelConfigured = false;

const ensureHandlerConfigured = () => {
  if (!isNativeMobile || handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigured = true;
};

const ensureAndroidChannel = async () => {
  if (!isNativeMobile || Platform.OS !== "android" || channelConfigured) {
    return;
  }

  await Notifications.setNotificationChannelAsync("appointment-reminders", {
    name: "Appointment reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: "default",
  });
  channelConfigured = true;
};

const normalizePermissionStatus = (
  status: Notifications.PermissionStatus | undefined
): NotificationPermissionStatus => {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "unknown";
};

export const isNativeNotificationSupported = () => isNativeMobile;

export const getNativeNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!isNativeMobile) {
    return "unknown";
  }

  ensureHandlerConfigured();
  const permission = await Notifications.getPermissionsAsync();
  return normalizePermissionStatus(permission.status);
};

export const requestNativeNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!isNativeMobile) {
    return "unknown";
  }

  ensureHandlerConfigured();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") {
    await ensureAndroidChannel();
    return "granted";
  }

  const requested = await Notifications.requestPermissionsAsync();
  const status = normalizePermissionStatus(requested.status);

  if (status === "granted") {
    await ensureAndroidChannel();
  }

  return status;
};

export const scheduleNativeReminder = async ({
  title,
  body,
  triggerAt,
  appointmentId,
}: {
  title: string;
  body: string;
  triggerAt: Date;
  appointmentId: string;
}) => {
  if (!isNativeMobile) return null;

  ensureHandlerConfigured();
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: { appointmentId },
    },
    trigger: triggerAt,
  });
};

export const cancelNativeReminders = async (notificationIds: string[]) => {
  if (!isNativeMobile || notificationIds.length === 0) return;

  await Promise.allSettled(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
};
