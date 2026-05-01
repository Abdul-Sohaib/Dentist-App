import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type NotificationPermissionStatus = "unknown" | "granted" | "denied";

export const APPOINTMENT_ALERTS_CHANNEL_ID = "appointment_alerts";
export const APPOINTMENT_ALERT_SOUND = "alertdemo.mp3";

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
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigured = true;
};

export const ensureAppointmentAlertsChannel = async () => {
  if (!isNativeMobile || Platform.OS !== "android" || channelConfigured) {
    return;
  }

  await Notifications.setNotificationChannelAsync(APPOINTMENT_ALERTS_CHANNEL_ID, {
    name: "Appointment alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: APPOINTMENT_ALERT_SOUND,
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
  const permission = (await Notifications.getPermissionsAsync()) as any;
  return normalizePermissionStatus(permission.status);
};

export const requestNativeNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!isNativeMobile) {
    return "unknown";
  }

  ensureHandlerConfigured();
  const existing = (await Notifications.getPermissionsAsync()) as any;
  if (existing.status === "granted") {
    await ensureAppointmentAlertsChannel();
    return "granted";
  }

  const requested = (await Notifications.requestPermissionsAsync()) as any;
  const status = normalizePermissionStatus(requested.status);

  if (status === "granted") {
    await ensureAppointmentAlertsChannel();
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
  await ensureAppointmentAlertsChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: APPOINTMENT_ALERT_SOUND,
      data: { appointmentId },
    },
    trigger: {
      channelId: APPOINTMENT_ALERTS_CHANNEL_ID,
      date: triggerAt,
    } as unknown as Notifications.NotificationTriggerInput,
  });
};

export const cancelNativeReminders = async (notificationIds: string[]) => {
  if (!isNativeMobile || notificationIds.length === 0) return;

  await Promise.allSettled(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
};
