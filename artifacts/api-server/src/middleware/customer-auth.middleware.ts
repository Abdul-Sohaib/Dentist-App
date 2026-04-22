import type { NextFunction, Response } from "express";
import type { CustomerAuthenticatedRequest } from "../types/auth";
import { verifyCustomerToken } from "../utils/jwt";

export const customerAuthMiddleware = (
  req: CustomerAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const { customerId } = verifyCustomerToken(token);
    req.customerId = customerId;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
