import { Schema, model, type InferSchemaType } from "mongoose";

export const APPOINTMENT_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "completed",
  "confirmed",
  "cancelled",
] as const;

const appointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    dentistId: { type: Schema.Types.ObjectId, ref: "Dentist", required: true, index: true },
    bookedByCustomerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    ticketId: { type: String, required: true, unique: true, index: true },
    bookedForName: { type: String, default: "", trim: true },
    bookedForPhone: { type: String, default: "", trim: true },
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ dentistId: 1, date: 1, timeSlot: 1 }, { unique: true });

export type AppointmentDocument = InferSchemaType<typeof appointmentSchema> & { _id: string };

const Appointment = model("Appointment", appointmentSchema);

export default Appointment;
