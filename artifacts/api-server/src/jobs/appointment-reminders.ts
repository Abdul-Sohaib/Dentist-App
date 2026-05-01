import cron from "node-cron";
import Appointment from "../models/Appointment";
import Customer from "../models/Customer";
import { sendExpoPushNotification, APPOINTMENT_ALERTS_CHANNEL_ID, APPOINTMENT_ALERT_SOUND } from "../services/push-notifications";
import { getReminderWindow } from "../utils/appointment-time";
import { logger } from "../lib/logger";

let reminderJobStarted = false;

export const startAppointmentReminderJob = () => {
  if (reminderJobStarted) {
    return;
  }

  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const { windowStart, windowEnd } = getReminderWindow(new Date());
        const appointments = await Appointment.find({
          status: { $in: ["accepted", "confirmed"] },
          reminderSent: false,
          appointmentAt: { $gte: windowStart, $lt: windowEnd },
          bookedByCustomerId: { $ne: null },
        }).select("_id bookedByCustomerId appointmentAt ticketId date timeSlot");

        for (const appointment of appointments) {
          const customerId = String(appointment.bookedByCustomerId ?? "");
          if (!customerId) continue;

          const customer = await Customer.findById(customerId).select("expoPushToken");
          const expoPushToken = customer?.expoPushToken ?? "";

          await sendExpoPushNotification(expoPushToken, {
            title: "Appointment Reminder",
            body: "Your appointment is in 30 minutes. Please leave now for ease.",
            sound: APPOINTMENT_ALERT_SOUND,
            channelId: APPOINTMENT_ALERTS_CHANNEL_ID,
            priority: "high",
            data: {
              appointmentId: String(appointment._id),
              ticketId: appointment.ticketId,
              date: appointment.date,
              time: appointment.timeSlot,
              type: "appointment_reminder_30m",
            },
          });

          await Appointment.updateOne({ _id: appointment._id, reminderSent: false }, { $set: { reminderSent: true } });
        }
      } catch (error) {
        logger.error({ err: error }, "Failed to process appointment reminders");
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  reminderJobStarted = true;
};
