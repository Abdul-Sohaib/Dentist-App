import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import Dentist from "../models/Dentist";
import { signDentistToken } from "../utils/jwt";
import { dbUnavailableMessage, isMongoConnectivityError } from "../utils/db-errors";

const mapDentist = (dentist: {
  _id: string;
  name: string;
  clinicName: string;
  phone: string;
  email: string;
  bio: string;
  location?: string;
  workingHours: { start: string; end: string };
  workingDays: number[];
  slotDuration: number;
  breakTimes: { start: string; end: string }[];
}) => ({
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
