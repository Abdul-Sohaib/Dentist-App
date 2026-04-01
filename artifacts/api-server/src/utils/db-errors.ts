export const isMongoConnectivityError = (error: unknown) => {
  const message = String(error ?? "");
  return (
    message.includes("MongoServerSelectionError") ||
    message.includes("MongooseServerSelectionError") ||
    message.includes("ECONNREFUSED") ||
    message.includes("tlsv1 alert")
  );
};

export const dbUnavailableMessage =
  "Database unavailable. Check MongoDB Atlas network access/whitelist and TLS settings.";
