import { Router } from "express";
import {
  createPatient,
  deletePatientById,
  getPatientById,
  getPatients,
  updatePatientById,
} from "../controllers/patient.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const patientsRouter = Router();

patientsRouter.use(authMiddleware);
patientsRouter.post("/", createPatient);
patientsRouter.get("/", getPatients);
patientsRouter.get("/:id", getPatientById);
patientsRouter.patch("/:id", updatePatientById);
patientsRouter.delete("/:id", deletePatientById);

export default patientsRouter;
