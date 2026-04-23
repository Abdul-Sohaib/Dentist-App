import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Asset } from "expo-asset";
import { AppState } from "react-native";
import { API_BASE_URL } from "@/constants/api";
import {
  cancelNativeReminders,
  getNativeNotificationPermission,
  isNativeNotificationSupported,
  requestNativeNotificationPermission,
  scheduleNativeReminder,
  type NotificationPermissionStatus,
} from "@/utils/nativeNotifications";

export interface DentistProfile {
  id: string;
  name: string;
  clinicName: string;
  location: string;
  phone: string;
  email: string;
  password?: string;
  workingHours: { start: string; end: string };
  workingDays: number[];
  slotDuration: number;
  breakTimes: { start: string; end: string }[];
  bio: string;
  specialty?: string;
  experience?: number;
  rating?: number;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  notificationPermission: "unknown" | "granted" | "denied";
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
  lastVisit?: string;
}

export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "confirmed"
  | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  ticketId?: string;
  bookedForName?: string;
  bookedForPhone?: string;
  date: string;
  time: string;
  problem: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface CustomerAlert {
  id: string;
  appointmentId: string;
  type: string;
  title: string;
  message: string;
  scheduledFor?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
}

interface AppContextType {
  isLoading: boolean;
  activeRole: "dentist" | "customer" | null;
  currentDentist: DentistProfile | null;
  currentCustomer: CustomerAccount | null;
  clinicProfile: DentistProfile;
  patients: Patient[];
  appointments: Appointment[];
  customerAppointments: Appointment[];
  customerAlerts: CustomerAlert[];
  dentistNotificationPermission: NotificationPermissionStatus;
  analytics: AnalyticsSummary;
  login: (email: string, password: string) => Promise<DentistProfile | null>;
  signup: (data: Omit<DentistProfile, "id"> & { password: string }) => Promise<DentistProfile>;
  logout: () => Promise<void>;
  customerRegister: (data: { name: string; phone: string; password: string }) => Promise<CustomerAccount>;
  customerLogin: (data: { phone: string; password: string }) => Promise<CustomerAccount>;
  customerLogout: () => Promise<void>;
  updateCustomerNotificationPermission: (status: "granted" | "denied") => Promise<void>;
  clearCustomerAlert: (alertId: string) => Promise<void>;
  clearAllCustomerAlerts: () => Promise<void>;
  updateProfile: (data: Partial<DentistProfile>) => Promise<void>;
  addPatient: (data: Omit<Patient, "id" | "createdAt">) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addAppointment: (data: Omit<Appointment, "id" | "createdAt" | "status">) => Promise<Appointment>;
  bookAsCustomer: (data: {
    patientName?: string;
    name?: string;
    phone?: string;
    problem: string;
    date: string;
    time: string;
    bookFor?: "self" | "other";
  }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAvailableSlots: (date: string) => Promise<string[]>;
  requestDentistNotificationPermission: () => Promise<NotificationPermissionStatus>;
  refreshAll: () => Promise<void>;
  refreshDentistDashboard: () => Promise<void>;
  refreshCustomerDashboard: () => Promise<void>;
}

const playFallbackTone = () => {
  const anyGlobal = globalThis as any;
  if (!anyGlobal?.window) return;

  const anyWindow = anyGlobal.window as any;
  const Ctx = anyWindow.AudioContext ?? anyWindow.webkitAudioContext;
  if (!Ctx) return;

  const context = new Ctx();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.15;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.16);
};

const playAlertSound = async () => {
  const anyGlobal = globalThis as any;
  if (!anyGlobal?.window) return;

  try {
    const uri = Asset.fromModule(
      require("../assets/sounds/alert-demo.mp3")
    ).uri;
    const audio = new anyGlobal.window.Audio(uri);
    await audio.play();
  } catch {
    playFallbackTone();
  }
};

const showBrowserNotification = (alert: CustomerAlert) => {
  const anyGlobal = globalThis as any;
  const NotificationApi = anyGlobal?.Notification;
  if (!NotificationApi) return;
  if (NotificationApi.permission !== "granted") return;

  try {
    // Browser-level notification popup.
    new NotificationApi(alert.title, {
      body: alert.message,
      tag: alert.id,
    });
  } catch {
    // Ignore browser notification errors and keep in-app alerts list.
  }
};

const STORAGE_DENTIST_TOKEN_KEY = "authToken";
const STORAGE_DENTIST_KEY = "currentDentist";
const STORAGE_CUSTOMER_TOKEN_KEY = "customerAuthToken";
const STORAGE_CUSTOMER_KEY = "currentCustomer";
const STORAGE_ACTIVE_ROLE_KEY = "activeRole";
const STORAGE_DENTIST_NOTIFICATION_PERMISSION_KEY = "dentistNotificationPermission";
const STORAGE_LOCAL_REMINDER_IDS_KEY = "localReminderNotificationIds";
const DENTIST_REFRESH_INTERVAL_MS = 15000;
const REMINDER_OFFSET_MS = 30 * 60 * 1000;
const REMINDER_MAX_ITEMS = 40;

const EMPTY_DENTIST: DentistProfile = {
  id: "",
  name: "Dentist",
  clinicName: "Clinic",
  location: "",
  phone: "",
  email: "",
  workingHours: { start: "09:00", end: "17:00" },
  workingDays: [1, 2, 3, 4, 5],
  slotDuration: 30,
  breakTimes: [{ start: "13:00", end: "14:00" }],
  bio: "",
};

const EMPTY_ANALYTICS: AnalyticsSummary = {
  totalPatients: 0,
  totalAppointments: 0,
  completedAppointments: 0,
  pendingAppointments: 0,
};

const AppContext = createContext<AppContextType | null>(null);

const toDentistProfile = (raw: unknown): DentistProfile => {
  const item = raw as Partial<DentistProfile> & { _id?: string; breaks?: { start: string; end: string }[] };
  return {
    id: item?.id ?? item?._id ?? "",
    name: item?.name ?? "",
    clinicName: item?.clinicName ?? "",
    location: item?.location ?? "",
    phone: item?.phone ?? "",
    email: item?.email ?? "",
    workingHours: item?.workingHours ?? { start: "09:00", end: "17:00" },
    workingDays: item?.workingDays ?? [1, 2, 3, 4, 5],
    slotDuration: item?.slotDuration ?? 30,
    breakTimes: item?.breakTimes ?? item?.breaks ?? [],
    bio: item?.bio ?? "",
    specialty: item?.specialty,
    experience: item?.experience,
    rating: item?.rating,
  };
};

const toCustomer = (raw: unknown): CustomerAccount => {
  const item = raw as Partial<CustomerAccount> & { _id?: string };
  const permission = item?.notificationPermission;
  return {
    id: item?.id ?? item?._id ?? "",
    name: item?.name ?? "",
    phone: item?.phone ?? "",
    notificationPermission:
      permission === "granted" || permission === "denied" ? permission : "unknown",
  };
};

const toPatient = (raw: unknown): Patient => {
  const item = raw as Partial<Patient> & { _id?: string };
  return {
    id: item?.id ?? item?._id ?? "",
    name: item?.name ?? "",
    phone: item?.phone ?? "",
    notes: item?.notes ?? "",
    createdAt: String(item?.createdAt ?? new Date().toISOString()),
    lastVisit: item?.lastVisit ?? "",
  };
};

const toAppointment = (raw: unknown): Appointment => {
  const item = raw as Partial<Appointment> & {
    _id?: string;
    timeSlot?: string;
    reason?: string;
  };
  return {
    id: item?.id ?? item?._id ?? "",
    patientId: String(item?.patientId ?? ""),
    ticketId: item?.ticketId ?? "",
    bookedForName: item?.bookedForName ?? "",
    bookedForPhone: item?.bookedForPhone ?? "",
    date: item?.date ?? "",
    time: item?.time ?? item?.timeSlot ?? "",
    problem: item?.problem ?? item?.reason ?? "",
    status: (item?.status ?? "pending") as AppointmentStatus,
    createdAt: String(item?.createdAt ?? new Date().toISOString()),
  };
};

const toAlert = (raw: unknown): CustomerAlert => {
  const item = raw as Partial<CustomerAlert> & { _id?: string };
  return {
    id: item?.id ?? item?._id ?? "",
    appointmentId: item?.appointmentId ?? "",
    type: item?.type ?? "",
    title: item?.title ?? "",
    message: item?.message ?? "",
    scheduledFor: item?.scheduledFor ?? null,
    deliveredAt: item?.deliveredAt ?? null,
    createdAt: String(item?.createdAt ?? new Date().toISOString()),
  };
};

const parsePermissionStatus = (value: string | null): NotificationPermissionStatus => {
  if (value === "granted" || value === "denied" || value === "unknown") {
    return value;
  }
  return "unknown";
};

const appointmentStartDateTime = (date: string, time: string) => {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const candidate = new Date(`${date}T${normalizedTime}:00`);

  if (!Number.isNaN(candidate.getTime())) {
    return candidate;
  }

  const fallback = new Date(`${date}T00:00:00`);
  const [hours, minutes] = normalizedTime.split(":").map((piece) => Number(piece));
  fallback.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return fallback;
};

const reminderTriggerDateTime = (startAt: Date) => {
  const preferred = new Date(startAt.getTime() - REMINDER_OFFSET_MS);
  const now = Date.now();

  if (preferred.getTime() > now) {
    return preferred;
  }

  if (startAt.getTime() > now) {
    return new Date(now + 5000);
  }

  return null;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(`Unable to connect to API at ${API_BASE_URL}. ${String(error)}`);
  }

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((payload as { message?: string })?.message ?? "Request failed");
  }

  return payload as T;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<"dentist" | "customer" | null>(null);
  const [dentistToken, setDentistToken] = useState<string | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [currentDentist, setCurrentDentist] = useState<DentistProfile | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(null);
  const [dentistNotificationPermission, setDentistNotificationPermission] =
    useState<NotificationPermissionStatus>("unknown");
  const [clinicProfile, setClinicProfile] = useState<DentistProfile>(EMPTY_DENTIST);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customerAppointments, setCustomerAppointments] = useState<Appointment[]>([]);
  const [customerAlerts, setCustomerAlerts] = useState<CustomerAlert[]>([]);
  const initializedAlertIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedAlertTrackingRef = useRef(false);
  const lastReminderSyncSignatureRef = useRef("");
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(EMPTY_ANALYTICS);

  const clearDentistState = useCallback(() => {
    setDentistToken(null);
    setCurrentDentist(null);
    setPatients([]);
    setAppointments([]);
    setAnalytics(EMPTY_ANALYTICS);
    setDentistNotificationPermission("unknown");
  }, []);

  const clearCustomerState = useCallback(() => {
    setCustomerToken(null);
    setCurrentCustomer(null);
    setCustomerAppointments([]);
    setCustomerAlerts([]);
  }, []);

  const loadPublicClinicInfo = useCallback(async () => {
    try {
      const data = await request<unknown>("/clinic-info");
      setClinicProfile((prev) => ({ ...prev, ...toDentistProfile(data) }));
    } catch (error) {
      console.warn("Unable to load public clinic info", error);
    }
  }, []);

  const fetchDentistProtectedData = useCallback(async (authToken: string) => {
    const [patientsRes, appointmentsRes, analyticsRes] = await Promise.all([
      request<{ patients: unknown[] }>("/patients", {}, authToken),
      request<{ appointments: unknown[] }>("/appointments", {}, authToken),
      request<AnalyticsSummary>("/analytics", {}, authToken),
    ]);

    setPatients((patientsRes.patients ?? []).map(toPatient));
    setAppointments((appointmentsRes.appointments ?? []).map(toAppointment));
    setAnalytics(analyticsRes);
  }, []);

  const refreshDentistDashboard = useCallback(async () => {
    if (!dentistToken) return;
    try {
      await fetchDentistProtectedData(dentistToken);
    } catch (error) {
      console.warn("Failed to refresh dentist dashboard", error);
    }
  }, [dentistToken, fetchDentistProtectedData]);

  const fetchCustomerDashboardData = useCallback(async (authToken: string) => {
    const data = await request<{
      customer: unknown;
      appointments: unknown[];
      alerts: unknown[];
      clinic: unknown;
    }>("/customer/dashboard", {}, authToken);

    setCurrentCustomer(toCustomer(data.customer));
    setCustomerAppointments((data.appointments ?? []).map(toAppointment));
    setCustomerAlerts((data.alerts ?? []).map(toAlert));

    if (data.clinic) {
      setClinicProfile((prev) => ({ ...prev, ...toDentistProfile(data.clinic) }));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [
          storedDentistToken,
          storedDentist,
          storedCustomerToken,
          storedCustomer,
          storedActiveRole,
          storedDentistNotificationPermission,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_DENTIST_TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_DENTIST_KEY),
          AsyncStorage.getItem(STORAGE_CUSTOMER_TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_CUSTOMER_KEY),
          AsyncStorage.getItem(STORAGE_ACTIVE_ROLE_KEY),
          AsyncStorage.getItem(STORAGE_DENTIST_NOTIFICATION_PERMISSION_KEY),
        ]);

        await loadPublicClinicInfo();

        if (storedActiveRole === "dentist" && storedDentistToken) {
          setActiveRole("dentist");
          setDentistToken(storedDentistToken);
          setDentistNotificationPermission(parsePermissionStatus(storedDentistNotificationPermission));
          if (storedDentist) {
            const dentist = toDentistProfile(JSON.parse(storedDentist));
            setCurrentDentist(dentist);
            setClinicProfile((prev) => ({ ...prev, ...dentist }));
          }
          try {
            await fetchDentistProtectedData(storedDentistToken);
          } catch {
            await AsyncStorage.multiRemove([
              STORAGE_DENTIST_TOKEN_KEY,
              STORAGE_DENTIST_KEY,
              STORAGE_ACTIVE_ROLE_KEY,
            ]);
            clearDentistState();
            setActiveRole(null);
          }
        } else if (storedActiveRole === "customer" && storedCustomerToken) {
          setActiveRole("customer");
          setCustomerToken(storedCustomerToken);
          if (storedCustomer) {
            setCurrentCustomer(toCustomer(JSON.parse(storedCustomer)));
          }
          try {
            await fetchCustomerDashboardData(storedCustomerToken);
          } catch {
            await AsyncStorage.multiRemove([
              STORAGE_CUSTOMER_TOKEN_KEY,
              STORAGE_CUSTOMER_KEY,
              STORAGE_ACTIVE_ROLE_KEY,
            ]);
            clearCustomerState();
            setActiveRole(null);
          }
        }
      } catch (error) {
        console.warn("App initialization warning", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    clearCustomerState,
    clearDentistState,
    fetchCustomerDashboardData,
    fetchDentistProtectedData,
    loadPublicClinicInfo,
  ]);

  const refreshCustomerDashboard = useCallback(async () => {
    if (!customerToken) return;
    try {
      await fetchCustomerDashboardData(customerToken);
    } catch (error) {
      console.warn("Failed to refresh customer dashboard", error);
    }
  }, [customerToken, fetchCustomerDashboardData]);

  const requestDentistNotificationPermission = useCallback(async () => {
    if (!isNativeNotificationSupported()) {
      return "unknown" as const;
    }

    try {
      const status = await requestNativeNotificationPermission();
      setDentistNotificationPermission(status);
      await AsyncStorage.setItem(STORAGE_DENTIST_NOTIFICATION_PERMISSION_KEY, status);
      return status;
    } catch (error) {
      console.warn("Unable to request dentist notification permission", error);
      setDentistNotificationPermission("denied");
      await AsyncStorage.setItem(STORAGE_DENTIST_NOTIFICATION_PERMISSION_KEY, "denied");
      return "denied" as const;
    }
  }, []);

  useEffect(() => {
    if (activeRole !== "dentist" || !isNativeNotificationSupported()) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const status = await getNativeNotificationPermission();
        if (!cancelled) {
          setDentistNotificationPermission(status);
        }
        await AsyncStorage.setItem(STORAGE_DENTIST_NOTIFICATION_PERMISSION_KEY, status);
      } catch (error) {
        console.warn("Unable to read dentist notification permission", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeRole]);

  useEffect(() => {
    if (activeRole !== "customer") {
      hasInitializedAlertTrackingRef.current = false;
      initializedAlertIdsRef.current = new Set();
      return;
    }

    if (!hasInitializedAlertTrackingRef.current) {
      hasInitializedAlertTrackingRef.current = true;
      initializedAlertIdsRef.current = new Set(customerAlerts.map((item) => item.id));
      return;
    }

    customerAlerts.forEach((alert) => {
      if (initializedAlertIdsRef.current.has(alert.id)) return;
      initializedAlertIdsRef.current.add(alert.id);
      showBrowserNotification(alert);
      void playAlertSound();
    });
  }, [activeRole, customerAlerts]);

  useEffect(() => {
    if (activeRole !== "dentist" || !dentistToken) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshDentistDashboard();
    }, DENTIST_REFRESH_INTERVAL_MS);

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshDentistDashboard();
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSub.remove();
    };
  }, [activeRole, dentistToken, refreshDentistDashboard]);

  useEffect(() => {
    if (!isNativeNotificationSupported()) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const osPermission = await getNativeNotificationPermission();
        const hasPermission =
          activeRole === "dentist"
            ? dentistNotificationPermission === "granted" && osPermission === "granted"
            : activeRole === "customer"
            ? currentCustomer?.notificationPermission === "granted" && osPermission === "granted"
            : false;

        if (!hasPermission) {
          const storedIdsRaw = await AsyncStorage.getItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
          const storedIds = storedIdsRaw ? (JSON.parse(storedIdsRaw) as string[]) : [];
          await cancelNativeReminders(storedIds);
          await AsyncStorage.removeItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
          lastReminderSyncSignatureRef.current = "";
          return;
        }

        const now = Date.now();
        const reminderInputs =
          activeRole === "dentist"
            ? appointments
                .filter((item) => item.status === "pending" || item.status === "confirmed" || item.status === "accepted")
                .map((item) => {
                  const startAt = appointmentStartDateTime(item.date, item.time);
                  const triggerAt = reminderTriggerDateTime(startAt);
                  if (!triggerAt || startAt.getTime() <= now) return null;
                  const patientLabel = item.bookedForName?.trim() || "your patient";
                  return {
                    key: `dentist:${item.id}:${item.date}:${item.time}`,
                    appointmentId: item.id,
                    triggerAt,
                    startsAt: startAt,
                    title: "Appointment in 30 minutes",
                    body: `${patientLabel} is scheduled at ${item.time}.`,
                  };
                })
                .filter((item): item is NonNullable<typeof item> => Boolean(item))
            : activeRole === "customer"
            ? customerAppointments
                .filter((item) => item.status === "pending" || item.status === "accepted")
                .map((item) => {
                  const startAt = appointmentStartDateTime(item.date, item.time);
                  const triggerAt = reminderTriggerDateTime(startAt);
                  if (!triggerAt || startAt.getTime() <= now) return null;
                  const clinicName = clinicProfile.clinicName?.trim() || "your clinic";
                  return {
                    key: `customer:${item.id}:${item.date}:${item.time}`,
                    appointmentId: item.id,
                    triggerAt,
                    startsAt: startAt,
                    title: "Appointment reminder",
                    body: `Your appointment at ${clinicName} is in 30 minutes.`,
                  };
                })
                .filter((item): item is NonNullable<typeof item> => Boolean(item))
            : [];

        const sortedReminders = reminderInputs
          .sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime())
          .slice(0, REMINDER_MAX_ITEMS);

        const signature = JSON.stringify(
          sortedReminders.map((item) => [item.key, item.triggerAt.toISOString()])
        );

        if (signature === lastReminderSyncSignatureRef.current) {
          return;
        }

        const storedIdsRaw = await AsyncStorage.getItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
        const storedIds = storedIdsRaw ? (JSON.parse(storedIdsRaw) as string[]) : [];
        await cancelNativeReminders(storedIds);

        const newlyScheduledIds: string[] = [];
        for (const reminder of sortedReminders) {
          const notificationId = await scheduleNativeReminder({
            appointmentId: reminder.appointmentId,
            title: reminder.title,
            body: reminder.body,
            triggerAt: reminder.triggerAt,
          });
          if (notificationId) {
            newlyScheduledIds.push(notificationId);
          }
        }

        if (cancelled) {
          await cancelNativeReminders(newlyScheduledIds);
          return;
        }

        await AsyncStorage.setItem(STORAGE_LOCAL_REMINDER_IDS_KEY, JSON.stringify(newlyScheduledIds));
        lastReminderSyncSignatureRef.current = signature;
      } catch (error) {
        console.warn("Failed to sync reminder notifications", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeRole,
    appointments,
    clinicProfile.clinicName,
    currentCustomer?.notificationPermission,
    customerAppointments,
    dentistNotificationPermission,
  ]);

  const refreshAll = useCallback(async () => {
    await loadPublicClinicInfo();
    if (dentistToken) await refreshDentistDashboard();
    if (customerToken) {
      await refreshCustomerDashboard();
    }
  }, [
    customerToken,
    dentistToken,
    loadPublicClinicInfo,
    refreshDentistDashboard,
    refreshCustomerDashboard,
  ]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await request<{ token: string; dentist: unknown }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const dentist = toDentistProfile(data.dentist);
      clearCustomerState();

      setActiveRole("dentist");
      setDentistToken(data.token);
      setCurrentDentist(dentist);
      setClinicProfile((prev) => ({ ...prev, ...dentist }));
      await AsyncStorage.multiSet([
        [STORAGE_DENTIST_TOKEN_KEY, data.token],
        [STORAGE_DENTIST_KEY, JSON.stringify(dentist)],
        [STORAGE_ACTIVE_ROLE_KEY, "dentist"],
      ]);
      await AsyncStorage.multiRemove([STORAGE_CUSTOMER_TOKEN_KEY, STORAGE_CUSTOMER_KEY]);

      await fetchDentistProtectedData(data.token);
      return dentist;
    },
    [clearCustomerState, fetchDentistProtectedData]
  );

  const signup = useCallback(
    async (formData: Omit<DentistProfile, "id"> & { password: string }) => {
      const payload = {
        ...formData,
        breakTimes: formData.breakTimes ?? [],
      };

      const data = await request<{ token: string; dentist: unknown }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const dentist = toDentistProfile(data.dentist);
      clearCustomerState();

      setActiveRole("dentist");
      setDentistToken(data.token);
      setCurrentDentist(dentist);
      setClinicProfile((prev) => ({ ...prev, ...dentist }));
      setPatients([]);
      setAppointments([]);
      setAnalytics(EMPTY_ANALYTICS);

      await AsyncStorage.multiSet([
        [STORAGE_DENTIST_TOKEN_KEY, data.token],
        [STORAGE_DENTIST_KEY, JSON.stringify(dentist)],
        [STORAGE_ACTIVE_ROLE_KEY, "dentist"],
      ]);
      await AsyncStorage.multiRemove([STORAGE_CUSTOMER_TOKEN_KEY, STORAGE_CUSTOMER_KEY]);

      return dentist;
    },
    [clearCustomerState]
  );

  const logout = useCallback(async () => {
    const reminderIdsRaw = await AsyncStorage.getItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
    const reminderIds = reminderIdsRaw ? (JSON.parse(reminderIdsRaw) as string[]) : [];
    await cancelNativeReminders(reminderIds);
    await AsyncStorage.removeItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
    lastReminderSyncSignatureRef.current = "";
    clearDentistState();
    setActiveRole(null);
    await AsyncStorage.multiRemove([
      STORAGE_DENTIST_TOKEN_KEY,
      STORAGE_DENTIST_KEY,
      STORAGE_ACTIVE_ROLE_KEY,
    ]);
  }, [clearDentistState]);

  const customerRegister = useCallback(
    async (data: { name: string; phone: string; password: string }) => {
      const response = await request<{ token: string; customer: unknown }>("/customer/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const customer = toCustomer(response.customer);
      clearDentistState();

      setActiveRole("customer");
      setCustomerToken(response.token);
      setCurrentCustomer(customer);
      await AsyncStorage.multiSet([
        [STORAGE_CUSTOMER_TOKEN_KEY, response.token],
        [STORAGE_CUSTOMER_KEY, JSON.stringify(customer)],
        [STORAGE_ACTIVE_ROLE_KEY, "customer"],
      ]);
      await AsyncStorage.multiRemove([STORAGE_DENTIST_TOKEN_KEY, STORAGE_DENTIST_KEY]);

      await fetchCustomerDashboardData(response.token);
      return customer;
    },
    [clearDentistState, fetchCustomerDashboardData]
  );

  const customerLogin = useCallback(
    async (data: { phone: string; password: string }) => {
      const response = await request<{ token: string; customer: unknown }>("/customer/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const customer = toCustomer(response.customer);
      clearDentistState();

      setActiveRole("customer");
      setCustomerToken(response.token);
      setCurrentCustomer(customer);
      await AsyncStorage.multiSet([
        [STORAGE_CUSTOMER_TOKEN_KEY, response.token],
        [STORAGE_CUSTOMER_KEY, JSON.stringify(customer)],
        [STORAGE_ACTIVE_ROLE_KEY, "customer"],
      ]);
      await AsyncStorage.multiRemove([STORAGE_DENTIST_TOKEN_KEY, STORAGE_DENTIST_KEY]);

      await fetchCustomerDashboardData(response.token);
      return customer;
    },
    [clearDentistState, fetchCustomerDashboardData]
  );

  const customerLogout = useCallback(async () => {
    const reminderIdsRaw = await AsyncStorage.getItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
    const reminderIds = reminderIdsRaw ? (JSON.parse(reminderIdsRaw) as string[]) : [];
    await cancelNativeReminders(reminderIds);
    await AsyncStorage.removeItem(STORAGE_LOCAL_REMINDER_IDS_KEY);
    lastReminderSyncSignatureRef.current = "";
    clearCustomerState();
    setActiveRole(null);
    await AsyncStorage.multiRemove([
      STORAGE_CUSTOMER_TOKEN_KEY,
      STORAGE_CUSTOMER_KEY,
      STORAGE_ACTIVE_ROLE_KEY,
    ]);
  }, [clearCustomerState]);

  const updateCustomerNotificationPermission = useCallback(
    async (status: "granted" | "denied") => {
      if (!customerToken) throw new Error("Customer not authenticated");

      const res = await request<{ customer: unknown }>(
        "/customer/notification-permission",
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        customerToken
      );

      const updatedCustomer = toCustomer(res.customer);
      setCurrentCustomer(updatedCustomer);
      await AsyncStorage.setItem(STORAGE_CUSTOMER_KEY, JSON.stringify(updatedCustomer));
      await refreshCustomerDashboard();
    },
    [customerToken, refreshCustomerDashboard]
  );

  const clearCustomerAlert = useCallback(
    async (alertId: string) => {
      if (!customerToken) throw new Error("Customer not authenticated");

      await request<{ message: string }>(`/customer/alerts/${alertId}`, { method: "DELETE" }, customerToken);
      setCustomerAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      initializedAlertIdsRef.current.delete(alertId);
    },
    [customerToken]
  );

  const clearAllCustomerAlerts = useCallback(async () => {
    if (!customerToken) throw new Error("Customer not authenticated");

    await request<{ message: string }>("/customer/alerts", { method: "DELETE" }, customerToken);
    setCustomerAlerts([]);
    initializedAlertIdsRef.current = new Set();
  }, [customerToken]);

  const updateProfile = useCallback(
    async (data: Partial<DentistProfile>) => {
      const merged = {
        ...(currentDentist ?? clinicProfile),
        ...data,
      };

      setCurrentDentist(merged);
      setClinicProfile((prev) => ({ ...prev, ...merged }));
      await AsyncStorage.setItem(STORAGE_DENTIST_KEY, JSON.stringify(merged));
    },
    [clinicProfile, currentDentist]
  );

  const addPatient = useCallback(
    async (data: Omit<Patient, "id" | "createdAt">) => {
      if (!dentistToken) throw new Error("Not authenticated");

      const res = await request<{ patient: unknown }>(
        "/patients",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        dentistToken
      );

      const patient = toPatient(res.patient);
      setPatients((prev) => [patient, ...prev]);
      setAnalytics((prev) => ({ ...prev, totalPatients: prev.totalPatients + 1 }));
      return patient;
    },
    [dentistToken]
  );

  const updatePatient = useCallback(
    async (id: string, data: Partial<Patient>) => {
      if (!dentistToken) throw new Error("Not authenticated");

      const res = await request<{ patient: unknown }>(
        `/patients/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
        dentistToken
      );

      const updated = toPatient(res.patient);
      setPatients((prev) => prev.map((patient) => (patient.id === id ? updated : patient)));
    },
    [dentistToken]
  );

  const deletePatient = useCallback(
    async (id: string) => {
      if (!dentistToken) throw new Error("Not authenticated");

      await request<{ message: string }>(`/patients/${id}`, { method: "DELETE" }, dentistToken);

      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      setAppointments((prev) => prev.filter((appointment) => appointment.patientId !== id));
      setAnalytics((prev) => ({
        ...prev,
        totalPatients: Math.max(0, prev.totalPatients - 1),
      }));
    },
    [dentistToken]
  );

  const addAppointment = useCallback(
    async (data: Omit<Appointment, "id" | "createdAt" | "status">) => {
      if (!dentistToken) throw new Error("Not authenticated");

      const res = await request<{ appointment: unknown }>(
        "/appointments",
        {
          method: "POST",
          body: JSON.stringify({
            patientId: data.patientId,
            date: data.date,
            timeSlot: data.time,
            reason: data.problem,
          }),
        },
        dentistToken
      );

      const appointment = toAppointment(res.appointment);
      setAppointments((prev) => [appointment, ...prev]);
      setAnalytics((prev) => ({
        ...prev,
        totalAppointments: prev.totalAppointments + 1,
        pendingAppointments: prev.pendingAppointments + 1,
      }));
      return appointment;
    },
    [dentistToken]
  );

  const bookAsCustomer = useCallback(
    async (data: {
      patientName?: string;
      name?: string;
      phone?: string;
      problem: string;
      date: string;
      time: string;
      bookFor?: "self" | "other";
    }) => {
      if (!customerToken) {
        throw new Error("Please login first to book an appointment");
      }

      const payload = {
        patientName: data.patientName ?? data.name ?? "",
        phone: data.phone ?? "",
        date: data.date,
        timeSlot: data.time,
        problem: data.problem,
        reason: data.problem,
        bookFor: data.bookFor ?? "self",
      };

      const res = await request<{ appointment: unknown }>(
        "/customer/appointments",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        customerToken
      );

      const appointment = toAppointment(res.appointment);
      setCustomerAppointments((prev) => [appointment, ...prev]);
      await refreshCustomerDashboard();
      return appointment;
    },
    [customerToken, refreshCustomerDashboard]
  );

  const updateAppointmentStatus = useCallback(
    async (id: string, status: Appointment["status"]) => {
      if (!dentistToken) throw new Error("Not authenticated");

      const res = await request<{ appointment: unknown }>(
        `/appointments/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        dentistToken
      );

      const updated = toAppointment(res.appointment);
      setAppointments((prev) => prev.map((appointment) => (appointment.id === id ? updated : appointment)));

      const analyticsRes = await request<AnalyticsSummary>("/analytics", {}, dentistToken);
      setAnalytics(analyticsRes);
    },
    [dentistToken]
  );

  const deleteAppointment = useCallback(
    async (id: string) => {
      if (!dentistToken) throw new Error("Not authenticated");

      await request<{ message: string }>(`/appointments/${id}`, { method: "DELETE" }, dentistToken);
      setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
      const analyticsRes = await request<AnalyticsSummary>("/analytics", {}, dentistToken);
      setAnalytics(analyticsRes);
    },
    [dentistToken]
  );

  const getAvailableSlots = useCallback(
    async (date: string) => {
      if (customerToken && activeRole === "customer") {
        const data = await request<{ slots: string[] }>(
          `/customer/available-slots?date=${encodeURIComponent(date)}`,
          {},
          customerToken
        );
        return data.slots ?? [];
      }

      const data = await request<{ slots: string[] }>(`/available-slots?date=${encodeURIComponent(date)}`);
      return data.slots ?? [];
    },
    [activeRole, customerToken]
  );

  const value = useMemo<AppContextType>(
    () => ({
      isLoading,
      activeRole,
      currentDentist,
      currentCustomer,
      clinicProfile,
      patients,
      appointments,
      customerAppointments,
      customerAlerts,
      dentistNotificationPermission,
      analytics,
      login,
      signup,
      logout,
      customerRegister,
      customerLogin,
      customerLogout,
      updateCustomerNotificationPermission,
      clearCustomerAlert,
      clearAllCustomerAlerts,
      updateProfile,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      bookAsCustomer,
      updateAppointmentStatus,
      deleteAppointment,
      getAvailableSlots,
      requestDentistNotificationPermission,
      refreshAll,
      refreshDentistDashboard,
      refreshCustomerDashboard,
    }),
    [
      activeRole,
      addAppointment,
      addPatient,
      analytics,
      appointments,
      bookAsCustomer,
      clinicProfile,
      currentCustomer,
      currentDentist,
      customerAlerts,
      customerAppointments,
      customerLogin,
      customerLogout,
      clearAllCustomerAlerts,
      clearCustomerAlert,
      customerRegister,
      deleteAppointment,
      deletePatient,
      dentistNotificationPermission,
      getAvailableSlots,
      isLoading,
      login,
      logout,
      patients,
      refreshAll,
      refreshDentistDashboard,
      refreshCustomerDashboard,
      requestDentistNotificationPermission,
      signup,
      updateAppointmentStatus,
      updateCustomerNotificationPermission,
      updatePatient,
      updateProfile,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
