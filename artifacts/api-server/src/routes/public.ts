import { Router } from "express";
import {
  bookAppointmentPublic,
  getClinicInfo,
  getPublicAvailableSlots,
} from "../controllers/public.controller";

const publicRouter = Router();

publicRouter.get("/clinic-info", getClinicInfo);
publicRouter.get("/available-slots", getPublicAvailableSlots);
publicRouter.post("/book-appointment", bookAppointmentPublic);

export default publicRouter;
