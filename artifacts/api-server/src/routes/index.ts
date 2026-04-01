import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import publicRouter from "./public";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/patients", patientsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/analytics", analyticsRouter);
router.use(publicRouter);

export default router;
