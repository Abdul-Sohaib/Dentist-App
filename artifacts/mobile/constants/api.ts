const PLACEHOLDER_BACKEND = "https://your-backend-url";

const inferDefaultUrl = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:5000`;
  }

  return "http://localhost:5000";
};

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL =
  configuredUrl && configuredUrl !== PLACEHOLDER_BACKEND
    ? configuredUrl
    : inferDefaultUrl();

export const API_BASE_URL = API_URL.endsWith("/") ? `${API_URL}api` : `${API_URL}/api`;
