import type { Response } from "express";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import type { AuthenticatedRequest } from "../types/auth";

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dentistId = req.dentistId;

    const [
      totalPatients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
    ] = await Promise.all([
      Patient.countDocuments({ dentistId }),
      Appointment.countDocuments({ dentistId }),
      Appointment.countDocuments({ dentistId, status: "completed" }),
      Appointment.countDocuments({ dentistId, status: "pending" }),
    ]);

    return res.status(200).json({
      totalPatients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch analytics", error: String(error) });
  }
};
