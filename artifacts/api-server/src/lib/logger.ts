import pino from "pino";
import pretty from "pino-pretty";

const isProduction = process.env.NODE_ENV === "production";

export const logger = isProduction
  ? pino({
      level: process.env.LOG_LEVEL ?? "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']",
      ],
    })
  : pino(
      {
        level: process.env.LOG_LEVEL ?? "info",
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
        ],
      },
      pretty({ colorize: true })
    );
