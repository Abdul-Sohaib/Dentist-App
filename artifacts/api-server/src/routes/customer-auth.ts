import { Router } from "express";
import { loginCustomer, registerCustomer } from "../controllers/customer-auth.controller";

const customerAuthRouter = Router();

customerAuthRouter.post("/register", registerCustomer);
customerAuthRouter.post("/login", loginCustomer);

export default customerAuthRouter;
