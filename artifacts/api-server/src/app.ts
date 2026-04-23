import express, { type Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { loginCustomer, registerCustomer } from "./controllers/customer-auth.controller";

const app: Express = express();

// ✅ Logger (FIXED)
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
    },
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Explicit mounts keep customer auth endpoints stable across deploy/router drift.
app.post("/api/customer/auth/register", registerCustomer);
app.post("/api/customer/auth/login", loginCustomer);

app.use("/api", router);
// Compatibility mount for deployments/proxies that strip or rewrite the /api prefix.
app.use(router);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
