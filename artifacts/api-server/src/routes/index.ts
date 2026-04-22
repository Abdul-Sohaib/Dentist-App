import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import publicRouter from "./public";
import analyticsRouter from "./analytics";
import customerAuthRouter from "./customer-auth";
import customerRouter from "./customer";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/patients", patientsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/analytics", analyticsRouter);
router.use("/customer/auth", customerAuthRouter);
router.use("/customer", customerRouter);
router.use(publicRouter);

export default router;
