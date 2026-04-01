import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth";
import { verifyDentistToken } from "../utils/jwt";

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const { dentistId } = verifyDentistToken(token);
    req.dentistId = dentistId;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
