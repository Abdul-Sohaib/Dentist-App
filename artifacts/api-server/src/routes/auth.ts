import { Router } from "express";
import {
  deleteDentistShowcaseMedia,
  loginDentist,
  signupDentist,
  updateDentistPushToken,
  updateDentistProfile,
  uploadDentistProfilePhoto,
  uploadDentistShowcaseMedia,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/signup", signupDentist);
authRouter.post("/login", loginDentist);
authRouter.patch("/profile", authMiddleware, updateDentistProfile);
authRouter.post("/push-token", authMiddleware, updateDentistPushToken);
authRouter.post("/profile-photo", authMiddleware, uploadDentistProfilePhoto);
authRouter.post("/showcase-media", authMiddleware, uploadDentistShowcaseMedia);
authRouter.delete("/showcase-media", authMiddleware, deleteDentistShowcaseMedia);

export default authRouter;
