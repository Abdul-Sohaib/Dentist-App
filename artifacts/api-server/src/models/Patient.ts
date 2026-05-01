import { Schema, model, type InferSchemaType } from "mongoose";

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 130 },
    notes: { type: String, default: "" },
    lastVisit: { type: String, default: "" },
    dentistId: { type: Schema.Types.ObjectId, ref: "Dentist", required: true, index: true },
  },
  { timestamps: true }
);

export type PatientDocument = InferSchemaType<typeof patientSchema> & { _id: string };

const Patient = model("Patient", patientSchema);

export default Patient;
