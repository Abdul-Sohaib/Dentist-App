import { Router } from "express";
import {
  loginCustomer,
  registerCustomer,
  updateCustomerPushToken,
} from "../controllers/customer-auth.controller";
import { customerAuthMiddleware } from "../middleware/customer-auth.middleware";

const customerAuthRouter = Router();

customerAuthRouter.post("/register", registerCustomer);
customerAuthRouter.post("/login", loginCustomer);
customerAuthRouter.post("/push-token", customerAuthMiddleware, updateCustomerPushToken);

export default customerAuthRouter;
