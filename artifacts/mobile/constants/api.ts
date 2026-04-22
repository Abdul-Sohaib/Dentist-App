const PLACEHOLDER_BACKEND = "https://your-backend-url";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const inferDefaultUrl = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:5000`;
  }

  return "http://localhost:5000";
};

const normalizeConfiguredUrl = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === PLACEHOLDER_BACKEND) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.protocol === "https:" && LOCALHOST_HOSTNAMES.has(url.hostname)) {
      url.protocol = "http:";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return withProtocol.replace(/\/$/, "");
  }
};

const configuredUrl = normalizeConfiguredUrl(process.env.EXPO_PUBLIC_API_URL);

export const API_URL =
  configuredUrl ?? inferDefaultUrl();

export const API_BASE_URL = API_URL.endsWith("/") ? `${API_URL}api` : `${API_URL}/api`;
