import { Router } from "express";
import {
  clearAllCustomerAlerts,
  clearCustomerAlert,
  createCustomerAppointment,
  getCustomerAlerts,
  getCustomerAppointments,
  getCustomerAvailableSlots,
  getCustomerDashboard,
  updateCustomerNotificationPermission,
} from "../controllers/customer.controller";
import { customerAuthMiddleware } from "../middleware/customer-auth.middleware";

const customerRouter = Router();

customerRouter.use(customerAuthMiddleware);

customerRouter.get("/dashboard", getCustomerDashboard);
customerRouter.get("/appointments", getCustomerAppointments);
customerRouter.post("/appointments", createCustomerAppointment);
customerRouter.get("/available-slots", getCustomerAvailableSlots);
customerRouter.get("/alerts", getCustomerAlerts);
customerRouter.delete("/alerts", clearAllCustomerAlerts);
customerRouter.delete("/alerts/:id", clearCustomerAlert);
customerRouter.patch("/notification-permission", updateCustomerNotificationPermission);

export default customerRouter;
