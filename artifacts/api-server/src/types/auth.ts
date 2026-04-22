import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  dentistId?: string;
}

export interface CustomerAuthenticatedRequest extends Request {
  customerId?: string;
}
