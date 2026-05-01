import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export const APPOINTMENT_ALERTS_CHANNEL_ID = "appointment-alerts";
export const APPOINTMENT_ALERT_SOUND = "alert-demo.mp3";

export const isExpoPushToken = (token: string | null | undefined) =>
  typeof token === "string" && Expo.isExpoPushToken(token);

export async function sendExpoPushNotification(
  token: string | null | undefined,
  message: Omit<ExpoPushMessage, "to">
) {
  if (!isExpoPushToken(token)) {
    return;
  }

  const chunks = expo.chunkPushNotifications([{ to: token, ...message }]);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
