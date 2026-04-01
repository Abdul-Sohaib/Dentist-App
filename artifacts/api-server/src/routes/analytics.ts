import { Router } from "express";
import { getAnalytics } from "../controllers/analytics.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);
analyticsRouter.get("/", getAnalytics);

export default analyticsRouter;
