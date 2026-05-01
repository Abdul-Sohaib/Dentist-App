import { Schema, model, type InferSchemaType } from "mongoose";

export const NOTIFICATION_PERMISSION_STATUSES = ["unknown", "granted", "denied"] as const;

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true, index: true },
    password: { type: String, required: true },
    expoPushToken: { type: String, trim: true, default: "" },
    notificationPermission: {
      type: String,
      enum: NOTIFICATION_PERMISSION_STATUSES,
      default: "unknown",
      required: true,
    },
  },
  { timestamps: true }
);

export type CustomerDocument = InferSchemaType<typeof customerSchema> & { _id: string };

const Customer = model("Customer", customerSchema);

export default Customer;
