import { Router } from "express";
import { loginDentist, signupDentist } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/signup", signupDentist);
authRouter.post("/login", loginDentist);

export default authRouter;
