import { Schema, model, type InferSchemaType } from "mongoose";

export const ALERT_TYPES = [
  "appointment_booked",
  "appointment_accepted",
  "appointment_rejected",
  "appointment_completed",
  "customer_reminder_30m",
  "doctor_reminder_30m",
] as const;

const notificationAlertSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    dentistId: { type: Schema.Types.ObjectId, ref: "Dentist", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", index: true },
    type: { type: String, enum: ALERT_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    scheduledFor: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export type NotificationAlertDocument = InferSchemaType<typeof notificationAlertSchema> & { _id: string };

const NotificationAlert = model("NotificationAlert", notificationAlertSchema);

export default NotificationAlert;
