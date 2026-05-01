import type { Response } from "express";
import Appointment from "../models/Appointment";
import Customer, { NOTIFICATION_PERMISSION_STATUSES } from "../models/Customer";
import Dentist from "../models/Dentist";
import NotificationAlert from "../models/NotificationAlert";
import Patient from "../models/Patient";
import type { CustomerAuthenticatedRequest } from "../types/auth";
import { buildAppointmentDateTime } from "../utils/appointment-time";
import { generateSlots } from "../utils/slots";
import { dbUnavailableMessage, isMongoConnectivityError } from "../utils/db-errors";
import { uploadBase64ToCloudinary } from "../utils/cloudinary";

const ACTIVE_BOOKING_STATUSES = ["pending", "accepted", "confirmed"];

const toCustomerFacingStatus = (status: string): "pending" | "accepted" | "rejected" | "completed" => {
  if (status === "confirmed" || status === "accepted") return "accepted";
  if (status === "cancelled" || status === "rejected") return "rejected";
  if (status === "completed") return "completed";
  return "pending";
};

const mapAppointment = (appointment: any) => ({
  id: appointment._id,
  patientId: String(appointment.patientId),
  dentistId: String(appointment.dentistId),
  ticketId: appointment.ticketId,
  bookedForName: appointment.bookedForName ?? "",
  bookedForPhone: appointment.bookedForPhone ?? "",
  date: appointment.date,
  timeSlot: appointment.timeSlot,
  time: appointment.timeSlot,
  appointmentAt: appointment.appointmentAt,
  reason: appointment.reason ?? "",
  problem: appointment.reason ?? "",
  status: toCustomerFacingStatus(appointment.status),
  issueMedia: Array.isArray(appointment.issueMedia)
    ? appointment.issueMedia
    : appointment.issueMedia
    ? [appointment.issueMedia]
    : [],
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt,
});

const mapAlert = (alert: any) => ({
  id: alert._id,
  appointmentId: alert.appointmentId ? String(alert.appointmentId) : "",
  type: alert.type,
  title: alert.title,
  message: alert.message,
  scheduledFor: alert.scheduledFor ?? null,
  deliveredAt: alert.deliveredAt ?? null,
  createdAt: alert.createdAt,
});

const getSingleDentist = async () => Dentist.findOne().sort({ createdAt: 1 });

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

export const getCustomerDashboard = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [customer, dentist, appointments, alerts] = await Promise.all([
      Customer.findById(customerId),
      getSingleDentist(),
      Appointment.find({ bookedByCustomerId: customerId }).sort({ date: -1, timeSlot: 1 }),
      NotificationAlert.find({ customerId }).sort({ createdAt: -1 }),
    ]);

    if (!customer) {
      return res.status(401).json({ message: "Customer account not found" });
    }

    return res.status(200).json({
      customer: {
        id: String(customer._id),
        name: customer.name,
        phone: customer.phone,
        notificationPermission: customer.notificationPermission,
      },
      clinic: dentist
        ? {
            dentistId: String(dentist._id),
            name: dentist.name,
            clinicName: dentist.clinicName,
            phone: dentist.phone,
            bio: dentist.bio,
            location: dentist.location,
            profilePhotoUrl: dentist.profilePhotoUrl ?? "",
            socialLinks: dentist.socialLinks ?? {},
            workingHours: dentist.workingHours,
            workingDays: dentist.workingDays,
            slotDuration: dentist.slotDuration,
            breakTimes: dentist.breakTimes,
            showcasePhotos: dentist.showcasePhotos ?? [],
            showcaseVideos: dentist.showcaseVideos ?? [],
          }
        : null,
      appointments: appointments.map((appointment) =>
        mapAppointment({ ...appointment.toObject(), _id: String(appointment._id) })
      ),
      alerts: alerts.map((alert) => mapAlert({ ...alert.toObject(), _id: String(alert._id) })),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to fetch customer dashboard", error: String(error) });
  }
};

export const getCustomerAppointments = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const appointments = await Appointment.find({ bookedByCustomerId: customerId }).sort({ date: -1, timeSlot: 1 });

    return res.status(200).json({
      appointments: appointments.map((appointment) =>
        mapAppointment({ ...appointment.toObject(), _id: String(appointment._id) })
      ),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to fetch appointments", error: String(error) });
  }
};

export const getCustomerAlerts = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const alerts = await NotificationAlert.find({ customerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      alerts: alerts.map((alert) => mapAlert({ ...alert.toObject(), _id: String(alert._id) })),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to fetch alerts", error: String(error) });
  }
};

export const clearCustomerAlert = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");
    const alertId = String(req.params.id ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deleted = await NotificationAlert.findOneAndDelete({ _id: alertId, customerId });

    if (!deleted) {
      return res.status(404).json({ message: "Alert not found" });
    }

    return res.status(200).json({ message: "Alert cleared" });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to clear alert", error: String(error) });
  }
};

export const clearAllCustomerAlerts = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await NotificationAlert.deleteMany({ customerId });

    return res.status(200).json({
      message: "All alerts cleared",
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to clear all alerts", error: String(error) });
  }
};

export const getCustomerAvailableSlots = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const date = String(req.query.date ?? "");

    if (!date) {
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

export const createCustomerAppointment = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { patientName, phone, date, timeSlot, reason, problem, bookFor, issueMedia, age } = req.body;

    if (!date || !timeSlot || !problem) {
      return res.status(400).json({ message: "date, timeSlot and problem are required" });
    }

    const customer = await Customer.findById(customerId);
    const dentist = await getSingleDentist();

    if (!customer) {
      return res.status(401).json({ message: "Customer account not found" });
    }

    if (!dentist) {
      return res.status(404).json({ message: "Clinic not configured yet" });
    }

    const isSelfBooking = String(bookFor ?? "self") !== "other";
    const bookingName = isSelfBooking ? customer.name : String(patientName ?? "").trim();
    const bookingPhone = isSelfBooking ? customer.phone : String(phone ?? "").trim();

    if (!bookingName || !bookingPhone) {
      return res.status(400).json({ message: "patientName and phone are required for booking" });
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

    let patient = await Patient.findOne({ dentistId: dentist._id, phone: bookingPhone });

    if (!patient) {
      patient = await Patient.create({
        name: bookingName,
        phone: bookingPhone,
        notes: reason ?? problem ?? "",
        ...(typeof age === "number" ? { age } : {}),
        dentistId: dentist._id,
        lastVisit: "",
      });
    } else if (typeof age === "number") {
      patient.age = age;
      await patient.save();
    }

    const mediaInputs = Array.isArray(issueMedia) ? issueMedia : issueMedia ? [issueMedia] : [];
    const issueMediaPayload: Record<string, unknown>[] = [];
    for (const media of mediaInputs) {
      if (!media?.dataUri || !media?.kind) continue;
      const kind = String(media.kind);
      if (!["photo", "video"].includes(kind)) {
        return res.status(400).json({ message: "Invalid issue media kind" });
      }
      const upload = await uploadBase64ToCloudinary(
        String(media.dataUri),
        kind === "photo" ? "image" : "video",
        "dentbook/issues"
      );
      if (upload.resourceType === "video" && (upload.durationSeconds ?? 0) > 60) {
        return res.status(400).json({ message: "Issue video must be 60 seconds or less" });
      }
      issueMediaPayload.push({
        url: upload.url,
        publicId: upload.publicId,
        resourceType: upload.resourceType,
        durationSeconds: upload.durationSeconds,
      });
    }

    const ticketId = await generateTicketId();

    const appointment = await Appointment.create({
      patientId: patient._id,
      dentistId: dentist._id,
      bookedByCustomerId: customer._id,
      ticketId,
      bookedForName: bookingName,
      bookedForPhone: bookingPhone,
      date,
      timeSlot,
      appointmentAt: buildAppointmentDateTime(date, timeSlot),
      reason: reason ?? problem ?? "",
      issueMedia: issueMediaPayload,
      status: "pending",
      reminderSent: false,
    });

    await NotificationAlert.create({
      customerId: customer._id,
      dentistId: dentist._id,
      appointmentId: appointment._id,
      type: "appointment_booked",
      title: "Appointment booked",
      message: `Ticket ${ticketId} is booked and waiting for clinic confirmation.`,
      deliveredAt: new Date(),
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: mapAppointment({ ...appointment.toObject(), _id: String(appointment._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to book appointment", error: String(error) });
  }
};

export const cancelCustomerAppointment = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");
    const appointmentId = String(req.params.id ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deleted = await Appointment.findOneAndDelete({
      _id: appointmentId,
      bookedByCustomerId: customerId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await NotificationAlert.deleteMany({ appointmentId: deleted._id });

    return res.status(200).json({ message: "Appointment cancelled and removed", removed: true });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to cancel appointment", error: String(error) });
  }
};

export const updateCustomerNotificationPermission = async (
  req: CustomerAuthenticatedRequest,
  res: Response
) => {
  try {
    const customerId = String(req.customerId ?? "");
    const status = String(req.body?.status ?? "");

    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!NOTIFICATION_PERMISSION_STATUSES.includes(status as "unknown" | "granted" | "denied")) {
      return res.status(400).json({ message: "Invalid notification permission status" });
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { $set: { notificationPermission: status } },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      customer: {
        id: String(customer._id),
        name: customer.name,
        phone: customer.phone,
        notificationPermission: customer.notificationPermission,
      },
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to update notification permission", error: String(error) });
  }
};
