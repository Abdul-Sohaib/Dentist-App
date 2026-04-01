import type { Response } from "express";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import type { AuthenticatedRequest } from "../types/auth";

const mapPatient = (patient: {
  _id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: string;
}) => ({
  id: patient._id,
  name: patient.name,
  phone: patient.phone,
  notes: patient.notes,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
  lastVisit: patient.lastVisit ?? "",
});

export const createPatient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "name and phone are required" });
    }

    const patient = await Patient.create({
      name,
      phone,
      notes: notes ?? "",
      dentistId: req.dentistId,
      lastVisit: "",
    });

    return res.status(201).json({ patient: mapPatient({ ...patient.toObject(), _id: String(patient._id) }) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create patient", error: String(error) });
  }
};

export const getPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patients = await Patient.find({ dentistId: req.dentistId }).sort({ createdAt: -1 });

    return res.status(200).json({
      patients: patients.map((patient) => mapPatient({ ...patient.toObject(), _id: String(patient._id) })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patients", error: String(error) });
  }
};

export const getPatientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findOne({ _id: id, dentistId: req.dentistId });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ patient: mapPatient({ ...patient.toObject(), _id: String(patient._id) }) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient", error: String(error) });
  }
};

export const updatePatientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findOneAndUpdate(
      { _id: id, dentistId: req.dentistId },
      {
        $set: {
          ...(req.body.name ? { name: req.body.name } : {}),
          ...(req.body.phone ? { phone: req.body.phone } : {}),
          ...(typeof req.body.notes === "string" ? { notes: req.body.notes } : {}),
        },
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ patient: mapPatient({ ...patient.toObject(), _id: String(patient._id) }) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update patient", error: String(error) });
  }
};

export const deletePatientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Patient.findOneAndDelete({ _id: id, dentistId: req.dentistId });

    if (!deleted) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await Appointment.deleteMany({ patientId: id, dentistId: req.dentistId });

    return res.status(200).json({ message: "Patient deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete patient", error: String(error) });
  }
};
