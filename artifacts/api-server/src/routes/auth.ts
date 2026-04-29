import { Router } from "express";
import {
  deleteDentistShowcaseMedia,
  loginDentist,
  signupDentist,
  updateDentistProfile,
  uploadDentistShowcaseMedia,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/signup", signupDentist);
authRouter.post("/login", loginDentist);
authRouter.patch("/profile", authMiddleware, updateDentistProfile);
authRouter.post("/showcase-media", authMiddleware, uploadDentistShowcaseMedia);
authRouter.delete("/showcase-media", authMiddleware, deleteDentistShowcaseMedia);

export default authRouter;
