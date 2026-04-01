import mongoose from "mongoose";
import { logger } from "../lib/logger";

const toBool = (value: string | undefined) =>
  value === "true" || value === "1" || value?.toLowerCase() === "yes";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      tlsAllowInvalidCertificates: toBool(process.env.MONGO_TLS_ALLOW_INVALID_CERTS),
      tlsAllowInvalidHostnames: toBool(process.env.MONGO_TLS_ALLOW_INVALID_HOSTS),
    });

    await mongoose.connection.db?.admin().command({ ping: 1 });
    logger.info("MongoDB connected");
  } catch (error) {
    const message = String(error);
    throw new Error(
      [
        "MongoDB connection failed.",
        "Common causes:",
        "1) Atlas Network Access does not include your current public IP.",
        "2) Atlas DB user/password is incorrect.",
        "3) Corporate/ISP firewall blocks TLS/DNS to *.mongodb.net.",
        `Original error: ${message}`,
      ].join(" ")
    );
  }
};
