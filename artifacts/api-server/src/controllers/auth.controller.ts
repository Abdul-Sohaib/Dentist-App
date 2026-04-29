import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import Dentist from "../models/Dentist";
import { signDentistToken } from "../utils/jwt";
import { dbUnavailableMessage, isMongoConnectivityError } from "../utils/db-errors";
import type { AuthenticatedRequest } from "../types/auth";
import { uploadBase64ToCloudinary } from "../utils/cloudinary";

const mapDentist = (dentist: any) => ({
  id: dentist._id,
  name: dentist.name,
  clinicName: dentist.clinicName,
  phone: dentist.phone,
  email: dentist.email,
  bio: dentist.bio,
  location: dentist.location ?? "",
  workingHours: dentist.workingHours,
  workingDays: dentist.workingDays,
  slotDuration: dentist.slotDuration,
  breakTimes: dentist.breakTimes,
  showcasePhotos: dentist.showcasePhotos ?? [],
  showcaseVideos: dentist.showcaseVideos ?? [],
});

export const signupDentist = async (req: Request, res: Response) => {
  try {
    const {
      name,
      clinicName,
      phone,
      email,
      password,
      workingHours,
      workingDays,
      slotDuration,
      breakTimes,
      bio,
      location,
    } = req.body;

    if (!name || !clinicName || !phone || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await Dentist.findOne({ email: String(email).toLowerCase() });

    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const dentist = await Dentist.create({
      name,
      clinicName,
      phone,
      email: String(email).toLowerCase(),
      password: hashedPassword,
      workingHours: workingHours ?? { start: "09:00", end: "17:00" },
      workingDays: workingDays ?? [1, 2, 3, 4, 5],
      slotDuration: slotDuration ?? 30,
      breakTimes: breakTimes ?? [],
      bio: bio ?? "",
      location: location ?? "",
    });

    const token = signDentistToken(String(dentist._id));

    return res.status(201).json({
      message: "Signup successful",
      token,
      dentist: mapDentist({ ...dentist.toObject(), _id: String(dentist._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Signup failed", error: String(error) });
  }
};

export const loginDentist = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const dentist = await Dentist.findOne({ email: String(email).toLowerCase() });

    if (!dentist) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(String(password), dentist.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signDentistToken(String(dentist._id));

    return res.status(200).json({
      message: "Login successful",
      token,
      dentist: mapDentist({ ...dentist.toObject(), _id: String(dentist._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Login failed", error: String(error) });
  }
};

export const updateDentistProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dentistId = String(req.dentistId ?? "");
    if (!dentistId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updates = req.body ?? {};
    const allowedKeys = [
      "name",
      "clinicName",
      "phone",
      "bio",
      "location",
      "workingHours",
      "workingDays",
      "slotDuration",
      "breakTimes",
      "showcasePhotos",
      "showcaseVideos",
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        patch[key] = updates[key];
      }
    }
    if (Array.isArray(patch.showcasePhotos) && patch.showcasePhotos.length > 3) {
      return res.status(400).json({ message: "Maximum 3 showcase photos allowed" });
    }
    if (Array.isArray(patch.showcaseVideos) && patch.showcaseVideos.length > 2) {
      return res.status(400).json({ message: "Maximum 2 showcase videos allowed" });
    }

    const dentist = await Dentist.findByIdAndUpdate(
      dentistId,
      { $set: patch },
      { new: true }
    );
    if (!dentist) {
      return res.status(404).json({ message: "Dentist not found" });
    }

    return res.status(200).json({
      dentist: mapDentist({ ...dentist.toObject(), _id: String(dentist._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to update profile", error: String(error) });
  }
};

export const uploadDentistShowcaseMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dentistId = String(req.dentistId ?? "");
    if (!dentistId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const kind = String(req.body?.kind ?? "");
    const dataUri = String(req.body?.dataUri ?? "");
    if (!["photo", "video"].includes(kind) || !dataUri.startsWith("data:")) {
      return res.status(400).json({ message: "kind and valid dataUri are required" });
    }

    const dentist = await Dentist.findById(dentistId);
    if (!dentist) {
      return res.status(404).json({ message: "Dentist not found" });
    }

    if (kind === "photo" && (dentist.showcasePhotos?.length ?? 0) >= 3) {
      return res.status(400).json({ message: "Maximum 3 showcase photos allowed" });
    }
    if (kind === "video" && (dentist.showcaseVideos?.length ?? 0) >= 2) {
      return res.status(400).json({ message: "Maximum 2 showcase videos allowed" });
    }

    const upload = await uploadBase64ToCloudinary(
      dataUri,
      kind === "photo" ? "image" : "video",
      "dentbook/showcase"
    );
    if (kind === "video" && (upload.durationSeconds ?? 0) > 60) {
      return res.status(400).json({ message: "Video duration must be 60 seconds or less" });
    }

    const field = kind === "photo" ? "showcasePhotos" : "showcaseVideos";
    (dentist as any)[field] = [...((dentist as any)[field] ?? []), upload];
    await dentist.save();

    return res.status(201).json({
      item: upload,
      dentist: mapDentist({ ...dentist.toObject(), _id: String(dentist._id) }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload showcase media", error: String(error) });
  }
};

export const deleteDentistShowcaseMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dentistId = String(req.dentistId ?? "");
    const publicId = String(req.query.publicId ?? "");
    if (!dentistId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!publicId) {
      return res.status(400).json({ message: "publicId is required" });
    }

    const dentist = await Dentist.findById(dentistId);
    if (!dentist) {
      return res.status(404).json({ message: "Dentist not found" });
    }

    dentist.set(
      "showcasePhotos",
      (dentist.showcasePhotos ?? []).filter((item: any) => item.publicId !== publicId)
    );
    dentist.set(
      "showcaseVideos",
      (dentist.showcaseVideos ?? []).filter((item: any) => item.publicId !== publicId)
    );
    await dentist.save();

    return res.status(200).json({
      dentist: mapDentist({ ...dentist.toObject(), _id: String(dentist._id) }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete showcase media", error: String(error) });
  }
};
