import { Schema, model, type InferSchemaType } from "mongoose";

const timeRangeSchema = new Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const workingHoursSchema = new Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const mediaItemSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
    durationSeconds: { type: Number },
  },
  { _id: false }
);

const dentistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    clinicName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    workingHours: { type: workingHoursSchema, required: true },
    workingDays: { type: [Number], required: true, default: [1, 2, 3, 4, 5] },
    slotDuration: { type: Number, required: true, default: 30 },
    breakTimes: { type: [timeRangeSchema], default: [] },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    showcasePhotos: { type: [mediaItemSchema], default: [] },
    showcaseVideos: { type: [mediaItemSchema], default: [] },
  },
  { timestamps: true }
);

export type DentistDocument = InferSchemaType<typeof dentistSchema> & { _id: string };

const Dentist = model("Dentist", dentistSchema);

export default Dentist;
