import type { Request, Response } from "express";
import Dentist from "../models/Dentist";
import Patient from "../models/Patient";
import Appointment from "../models/Appointment";
import { generateSlots } from "../utils/slots";
import { dbUnavailableMessage, isMongoConnectivityError } from "../utils/db-errors";

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

const getSingleDentist = async () => Dentist.findOne().sort({ createdAt: 1 });

export const getClinicInfo = async (_req: Request, res: Response) => {
  try {
    const dentist = await getSingleDentist();

    if (!dentist) {
      return res.status(404).json({ message: "Clinic not configured yet" });
    }

    return res.status(200).json({
      dentistId: String(dentist._id),
      name: dentist.name,
      clinicName: dentist.clinicName,
      phone: dentist.phone,
      bio: dentist.bio,
      location: dentist.location,
      workingHours: dentist.workingHours,
      workingDays: dentist.workingDays,
      slotDuration: dentist.slotDuration,
      breakTimes: dentist.breakTimes,
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to fetch clinic info", error: String(error) });
  }
};

export const getPublicAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res.status(400).json({ message: "date query parameter is required" });
    }

    const dentist = await getSingleDentist();

    if (!dentist) {
      return res.status(404).json({ message: "Clinic not configured yet" });
    }

    const day = new Date(`${date}T00:00:00`).getDay();

    if (!dentist.workingDays.includes(day)) {
      return res.status(200).json({ date, slots: [] });
    }

    const slots = generateSlots({
      workingHours: dentist.workingHours,
      slotDuration: dentist.slotDuration,
      breakTimes: dentist.breakTimes,
    });

    const booked = await Appointment.find({
      dentistId: dentist._id,
      date,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }).select("timeSlot -_id");

    const bookedSet = new Set(booked.map((item) => item.timeSlot));

    return res.status(200).json({
      dentistId: String(dentist._id),
      date,
      slots: slots.filter((slot) => !bookedSet.has(slot)),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to fetch available slots", error: String(error) });
  }
};

export const bookAppointmentPublic = async (req: Request, res: Response) => {
  try {
    const { name, phone, date, timeSlot, reason, problem } = req.body;

    if (!name || !phone || !date || !timeSlot) {
      return res.status(400).json({ message: "name, phone, date and timeSlot are required" });
    }

    const dentist = await getSingleDentist();

    if (!dentist) {
      return res.status(404).json({ message: "Clinic not configured yet" });
    }

    const existing = await Appointment.findOne({
      dentistId: dentist._id,
      date,
      timeSlot,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    });

    if (existing) {
      return res.status(409).json({ message: "Selected slot is already booked" });
    }

    let patient = await Patient.findOne({ dentistId: dentist._id, phone });

    if (!patient) {
      patient = await Patient.create({
        name,
        phone,
        notes: reason ?? problem ?? "",
        dentistId: dentist._id,
        lastVisit: "",
      });
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      dentistId: dentist._id,
      date,
      timeSlot,
      reason: reason ?? problem ?? "",
      status: "pending",
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        id: String(appointment._id),
        patientId: String(patient._id),
        dentistId: String(dentist._id),
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        time: appointment.timeSlot,
        reason: appointment.reason,
        problem: appointment.reason,
        status: appointment.status,
      },
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to book appointment", error: String(error) });
  }
};
