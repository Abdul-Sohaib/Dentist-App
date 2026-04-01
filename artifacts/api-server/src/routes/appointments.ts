import { Router } from "express";
import {
  createAppointment,
  deleteAppointmentById,
  getAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const appointmentsRouter = Router();

appointmentsRouter.use(authMiddleware);
appointmentsRouter.post("/", createAppointment);
appointmentsRouter.get("/", getAppointments);
appointmentsRouter.patch("/:id", updateAppointmentStatus);
appointmentsRouter.delete("/:id", deleteAppointmentById);

export default appointmentsRouter;
