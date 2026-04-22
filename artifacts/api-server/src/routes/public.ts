import { Router } from "express";
import {
  getClinicInfo,
  getPublicAvailableSlots,
} from "../controllers/public.controller";

const publicRouter = Router();

publicRouter.get("/clinic-info", getClinicInfo);
publicRouter.get("/available-slots", getPublicAvailableSlots);

export default publicRouter;
