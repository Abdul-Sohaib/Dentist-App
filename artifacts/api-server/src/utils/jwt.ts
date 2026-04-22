import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

export const signDentistToken = (dentistId: string) =>
  jwt.sign({ dentistId }, getJwtSecret(), { expiresIn: "7d" });

export const signCustomerToken = (customerId: string) =>
  jwt.sign({ customerId }, getJwtSecret(), { expiresIn: "7d" });

export const verifyDentistToken = (token: string): { dentistId: string } => {
  const payload = jwt.verify(token, getJwtSecret());

  if (!payload || typeof payload !== "object" || !("dentistId" in payload)) {
    throw new Error("Invalid token payload");
  }

  const dentistId = String((payload as { dentistId: unknown }).dentistId);

  return { dentistId };
};

export const verifyCustomerToken = (token: string): { customerId: string } => {
  const payload = jwt.verify(token, getJwtSecret());

  if (!payload || typeof payload !== "object" || !("customerId" in payload)) {
    throw new Error("Invalid token payload");
  }

  const customerId = String((payload as { customerId: unknown }).customerId);

  return { customerId };
};
