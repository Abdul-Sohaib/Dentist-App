import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "./config/db";

const startServer = async () => {
  try {
    await connectDB();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const port = Number(process.env.PORT) || 5000;

    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
    }

    app.listen(port, () => {
      logger.info({ port }, "Server running successfully");
    });
  } catch (err) {
    logger.error({ err }, "Server failed to start");
    process.exit(1);
  }
};

startServer();
