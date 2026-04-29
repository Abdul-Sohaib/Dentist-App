import type { Response } from "express";
import Appointment, { APPOINTMENT_STATUSES } from "../models/Appointment";
import Dentist from "../models/Dentist";
import NotificationAlert from "../models/NotificationAlert";
import Patient from "../models/Patient";
import type { AuthenticatedRequest } from "../types/auth";
import { generateSlots } from "../utils/slots";

const ACTIVE_BOOKING_STATUSES = ["pending", "accepted", "confirmed"];

const mapAppointment = (apt: any) => ({
  id: apt._id,
  patientId: String(apt.patientId),
  dentistId: String(apt.dentistId),
  bookedByCustomerId: apt.bookedByCustomerId ? String(apt.bookedByCustomerId) : "",
  ticketId: apt.ticketId ?? "",
  bookedForName: apt.bookedForName ?? "",
  bookedForPhone: apt.bookedForPhone ?? "",
  date: apt.date,
  timeSlot: apt.timeSlot,
  time: apt.timeSlot,
  reason: apt.reason ?? "",
  problem: apt.reason ?? "",
  issueMedia: apt.issueMedia ?? null,
  status: apt.status,
  createdAt: apt.createdAt,
  updatedAt: apt.updatedAt,
});

const toCustomerStatus = (status: string): "pending" | "accepted" | "rejected" | "completed" => {
  if (status === "accepted" || status === "confirmed") return "accepted";
  if (status === "rejected" || status === "cancelled") return "rejected";
  if (status === "completed") return "completed";
  return "pending";
};

const generateTicketId = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const ticketId = `DB-${Date.now().toString(36).toUpperCase()}-${random}`;
    const existing = await Appointment.findOne({ ticketId }).select("_id");

    if (!existing) {
      return ticketId;
    }
  }

  throw new Error("Unable to generate unique ticket ID");
};

const isSlotAvailable = async (dentistId: string, date: string, timeSlot: string) => {
  const existing = await Appointment.findOne({
    dentistId,
    date,
    timeSlot,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  return !existing;
};

export const createAppointment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, date, timeSlot, reason, problem, status } = req.body;

    if (!patientId || !date || !timeSlot) {
      return res.status(400).json({ message: "patientId, date and timeSlot are required" });
    }

    const patient = await Patient.findOne({ _id: patientId, dentistId: req.dentistId });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const available = await isSlotAvailable(String(req.dentistId), date, timeSlot);

    if (!available) {
      return res.status(409).json({ message: "Selected slot is already booked" });
    }

    const appointment = await Appointment.create({
      patientId,
      dentistId: req.dentistId,
      ticketId: await generateTicketId(),
      bookedForName: patient.name,
      bookedForPhone: patient.phone,
      date,
      timeSlot,
      reason: reason ?? problem ?? "",
      status: APPOINTMENT_STATUSES.includes(status) ? status : "pending",
    });

    return res.status(201).json({
      appointment: mapAppointment({ ...appointment.toObject(), _id: String(appointment._id) }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create appointment", error: String(error) });
  }
};

export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = { dentistId: req.dentistId };

    if (req.query.date) {
      query.date = req.query.date;
    }

    const appointments = await Appointment.find(query).sort({ date: -1, timeSlot: 1 });

    return res.status(200).json({
      appointments: appointments.map((apt) => mapAppointment({ ...apt.toObject(), _id: String(apt._id) })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments", error: String(error) });
  }
};

export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!APPOINTMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, dentistId: req.dentistId },
      { $set: { status } },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const customerId = appointment.bookedByCustomerId ? String(appointment.bookedByCustomerId) : "";
    const customerStatus = toCustomerStatus(status);

    if (customerId && ["accepted", "rejected", "completed"].includes(customerStatus)) {
      const notificationType =
        customerStatus === "accepted"
          ? "appointment_accepted"
          : customerStatus === "rejected"
          ? "appointment_rejected"
          : "appointment_completed";
      const title =
        customerStatus === "accepted"
          ? "Appointment accepted"
          : customerStatus === "rejected"
          ? "Appointment rejected"
          : "Appointment completed";
      const message =
        customerStatus === "accepted"
          ? `Your appointment ${appointment.ticketId} has been accepted by the clinic.`
          : customerStatus === "rejected"
          ? `Your appointment ${appointment.ticketId} has been rejected by the clinic.`
          : `Your appointment ${appointment.ticketId} has been marked as completed.`;

      await NotificationAlert.create({
        customerId,
        dentistId: appointment.dentistId,
        appointmentId: appointment._id,
        type: notificationType,
        title,
        message,
        deliveredAt: new Date(),
      });
    }

    return res.status(200).json({
      appointment: mapAppointment({ ...appointment.toObject(), _id: String(appointment._id) }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment", error: String(error) });
  }
};

export const deleteAppointmentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Appointment.findOneAndDelete({ _id: id, dentistId: req.dentistId });

    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete appointment", error: String(error) });
  }
};

export const getAvailableSlots = async (req: AuthenticatedRequest | { query: Record<string, unknown> }, res: Response) => {
  try {
    const date = String(req.query.date ?? "");

    if (!date) {
      return res.status(400).json({ message: "date query parameter is required" });
    }

    const dentistId = "dentistId" in req && req.dentistId
      ? req.dentistId
      : String(req.query.dentistId ?? "");

    if (!dentistId) {
      return res.status(400).json({ message: "dentistId is required" });
    }

    const dentist = await Dentist.findById(dentistId);

    if (!dentist) {
      return res.status(404).json({ message: "Dentist not found" });
    }

    const day = new Date(`${date}T00:00:00`).getDay();

    if (!dentist.workingDays.includes(day)) {
      return res.status(200).json({ date, slots: [] });
    }

    const allSlots = generateSlots({
      workingHours: dentist.workingHours,
      slotDuration: dentist.slotDuration,
      breakTimes: dentist.breakTimes,
    });

    const booked = await Appointment.find({
      dentistId,
      date,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }).select("timeSlot -_id");

    const bookedSet = new Set(booked.map((item) => item.timeSlot));
    const availableSlots = allSlots.filter((slot) => !bookedSet.has(slot));

    return res.status(200).json({ date, slots: availableSlots });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch slots", error: String(error) });
  }
};

