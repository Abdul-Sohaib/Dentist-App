import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import Customer from "../models/Customer";
import type { CustomerAuthenticatedRequest } from "../types/auth";
import { signCustomerToken } from "../utils/jwt";
import { dbUnavailableMessage, isMongoConnectivityError } from "../utils/db-errors";

const mapCustomer = (customer: {
  _id: string;
  name: string;
  phone: string;
  notificationPermission: "unknown" | "granted" | "denied";
  expoPushToken?: string;
}) => ({
  id: customer._id,
  name: customer.name,
  phone: customer.phone,
  notificationPermission: customer.notificationPermission,
  expoPushToken: customer.expoPushToken ?? "",
});

export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "name, phone and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedPhone = String(phone).trim();
    const existing = await Customer.findOne({ phone: normalizedPhone });

    if (existing) {
      return res.status(409).json({ message: "Phone number is already registered" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const customer = await Customer.create({
      name: String(name).trim(),
      phone: normalizedPhone,
      password: hashedPassword,
      expoPushToken: "",
      notificationPermission: "unknown",
    });

    const token = signCustomerToken(String(customer._id));

    return res.status(201).json({
      message: "Registration successful",
      token,
      customer: mapCustomer({ ...customer.toObject(), _id: String(customer._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Registration failed", error: String(error) });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "phone and password are required" });
    }

    const normalizedPhone = String(phone).trim();
    const customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(String(password), customer.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signCustomerToken(String(customer._id));

    return res.status(200).json({
      message: "Login successful",
      token,
      customer: mapCustomer({ ...customer.toObject(), _id: String(customer._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Login failed", error: String(error) });
  }
};

export const updateCustomerPushToken = async (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.customerId ?? "");
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const expoPushToken = String(req.body?.expoPushToken ?? "").trim();
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { $set: { expoPushToken } },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      customer: mapCustomer({ ...customer.toObject(), _id: String(customer._id) }),
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      return res.status(503).json({ message: dbUnavailableMessage });
    }
    return res.status(500).json({ message: "Failed to update push token", error: String(error) });
  }
};
