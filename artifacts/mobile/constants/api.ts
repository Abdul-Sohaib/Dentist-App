import Constants from "expo-constants";
import { Platform } from "react-native";

const PLACEHOLDER_BACKEND = "https://your-backend-url";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const extractHostFromExpoManifest = () => {
  const anyConstants = Constants as unknown as {
    manifest?: { debuggerHost?: string; hostUri?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    expoConfig?: { hostUri?: string };
  };

  const rawCandidates = [
    anyConstants.expoConfig?.hostUri,
    anyConstants.manifest2?.extra?.expoClient?.hostUri,
    anyConstants.manifest?.debuggerHost,
    anyConstants.manifest?.hostUri,
  ].filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);

  for (const candidate of rawCandidates) {
    const normalized = candidate.replace(/^https?:\/\//i, "");
    const host = normalized.split("/")[0]?.split(":")[0];
    if (host) {
      return host;
    }
  }

  return null;
};

const inferDefaultUrl = () => {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:5000`;
  }

  const expoHost = extractHostFromExpoManifest();
  if (expoHost) {
    return `http://${expoHost}:5000`;
  }

  if (Platform.OS === "android") {
    // Android emulators cannot reach host machine via localhost.
    return "http://10.0.2.2:5000";
  }

  return "http://127.0.0.1:5000";
};

const normalizeConfiguredUrl = (value?: string) => {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === PLACEHOLDER_BACKEND) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

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

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.replace(/\/+$/, "");

  const normalizePathnameToApiRoot = (pathname: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const apiIndex = segments.findIndex((segment) => segment.toLowerCase() === "api");

    if (apiIndex >= 0) {
      return `/${segments.slice(0, apiIndex + 1).join("/")}`;
    }

    if (segments.length === 0) {
      return "/api";
    }

    return `/${segments.join("/")}/api`;
  };

  try {
    const url = new URL(trimmed);
    const pathname = (url.pathname || "").replace(/\/+$/, "");
    url.pathname = normalizePathnameToApiRoot(pathname);

    return url.toString().replace(/\/$/, "");
  } catch {
    const normalized = trimmed.replace(/\/+$/, "");
    const apiMarkerIndex = normalized.toLowerCase().indexOf("/api");
    if (apiMarkerIndex >= 0) {
      return normalized.slice(0, apiMarkerIndex + 4);
    }
    return `${normalized}/api`;
  }
};

const configuredUrl =
  normalizeConfiguredUrl(process.env.EXPO_PUBLIC_API_URL) ??
  normalizeConfiguredUrl(process.env.EXPO_PUBLIC_DOMAIN);

export const API_URL = configuredUrl ?? inferDefaultUrl();
export const API_BASE_URL = normalizeApiBaseUrl(API_URL);
