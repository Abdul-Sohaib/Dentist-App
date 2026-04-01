import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE_URL } from "@/constants/api";

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

export interface Patient {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
  lastVisit?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  problem: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
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
  currentDentist: DentistProfile | null;
  clinicProfile: DentistProfile;
  patients: Patient[];
  appointments: Appointment[];
  analytics: AnalyticsSummary;
  login: (email: string, password: string) => Promise<DentistProfile | null>;
  signup: (data: Omit<DentistProfile, "id"> & { password: string }) => Promise<DentistProfile>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<DentistProfile>) => Promise<void>;
  addPatient: (data: Omit<Patient, "id" | "createdAt">) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addAppointment: (data: Omit<Appointment, "id" | "createdAt" | "status">) => Promise<Appointment>;
  bookAsCustomer: (data: {
    name: string;
    phone: string;
    problem: string;
    date: string;
    time: string;
  }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAvailableSlots: (date: string) => Promise<string[]>;
  refreshAll: () => Promise<void>;
}

const STORAGE_TOKEN_KEY = "authToken";
const STORAGE_DENTIST_KEY = "currentDentist";

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

const toDentistProfile = (raw: any): DentistProfile => ({
  id: raw?.id ?? raw?._id ?? "",
  name: raw?.name ?? "",
  clinicName: raw?.clinicName ?? "",
  location: raw?.location ?? "",
  phone: raw?.phone ?? "",
  email: raw?.email ?? "",
  workingHours: raw?.workingHours ?? { start: "09:00", end: "17:00" },
  workingDays: raw?.workingDays ?? [1, 2, 3, 4, 5],
  slotDuration: raw?.slotDuration ?? 30,
  breakTimes: raw?.breakTimes ?? raw?.breaks ?? [],
  bio: raw?.bio ?? "",
  specialty: raw?.specialty,
  experience: raw?.experience,
  rating: raw?.rating,
});

const toPatient = (raw: any): Patient => ({
  id: raw?.id ?? raw?._id ?? "",
  name: raw?.name ?? "",
  phone: raw?.phone ?? "",
  notes: raw?.notes ?? "",
  createdAt: String(raw?.createdAt ?? new Date().toISOString()),
  lastVisit: raw?.lastVisit ?? "",
});

const toAppointment = (raw: any): Appointment => ({
  id: raw?.id ?? raw?._id ?? "",
  patientId: String(raw?.patientId ?? ""),
  date: raw?.date ?? "",
  time: raw?.time ?? raw?.timeSlot ?? "",
  problem: raw?.problem ?? raw?.reason ?? "",
  status: raw?.status ?? "pending",
  createdAt: String(raw?.createdAt ?? new Date().toISOString()),
});

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
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload as T;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [currentDentist, setCurrentDentist] = useState<DentistProfile | null>(null);
  const [clinicProfile, setClinicProfile] = useState<DentistProfile>(EMPTY_DENTIST);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(EMPTY_ANALYTICS);

  const loadPublicClinicInfo = useCallback(async () => {
    try {
      const data = await request<any>("/clinic-info");
      setClinicProfile((prev) => ({ ...prev, ...toDentistProfile(data) }));
    } catch (error) {
      console.warn("Unable to load public clinic info", error);
    }
  }, []);

  const fetchProtectedData = useCallback(async (authToken: string) => {
    const [patientsRes, appointmentsRes, analyticsRes] = await Promise.all([
      request<{ patients: any[] }>("/patients", {}, authToken),
      request<{ appointments: any[] }>("/appointments", {}, authToken),
      request<AnalyticsSummary>("/analytics", {}, authToken),
    ]);

    setPatients((patientsRes.patients ?? []).map(toPatient));
    setAppointments((appointmentsRes.appointments ?? []).map(toAppointment));
    setAnalytics(analyticsRes);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedDentist] = await Promise.all([
          AsyncStorage.getItem(STORAGE_TOKEN_KEY),
          AsyncStorage.getItem(STORAGE_DENTIST_KEY),
        ]);

        await loadPublicClinicInfo();

        if (storedToken) {
          setToken(storedToken);

          if (storedDentist) {
            const dentist = toDentistProfile(JSON.parse(storedDentist));
            setCurrentDentist(dentist);
            setClinicProfile((prev) => ({ ...prev, ...dentist }));
          }

          try {
            await fetchProtectedData(storedToken);
          } catch {
            await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_DENTIST_KEY]);
            setToken(null);
            setCurrentDentist(null);
          }
        }
      } catch (error) {
        console.warn("App initialization warning", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [fetchProtectedData, loadPublicClinicInfo]);

  const refreshAll = useCallback(async () => {
    await loadPublicClinicInfo();
    if (token) {
      try {
        await fetchProtectedData(token);
      } catch (error) {
        console.warn("Failed to refresh protected data", error);
      }
    }
  }, [fetchProtectedData, loadPublicClinicInfo, token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await request<{ token: string; dentist: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const dentist = toDentistProfile(data.dentist);

    setToken(data.token);
    setCurrentDentist(dentist);
    setClinicProfile((prev) => ({ ...prev, ...dentist }));
    await AsyncStorage.multiSet([
      [STORAGE_TOKEN_KEY, data.token],
      [STORAGE_DENTIST_KEY, JSON.stringify(dentist)],
    ]);

    await fetchProtectedData(data.token);

    return dentist;
  }, [fetchProtectedData]);

  const signup = useCallback(async (formData: Omit<DentistProfile, "id"> & { password: string }) => {
    const payload = {
      ...formData,
      breakTimes: formData.breakTimes ?? [],
    };

    const data = await request<{ token: string; dentist: any }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const dentist = toDentistProfile(data.dentist);

    setToken(data.token);
    setCurrentDentist(dentist);
    setClinicProfile((prev) => ({ ...prev, ...dentist }));
    setPatients([]);
    setAppointments([]);
    setAnalytics(EMPTY_ANALYTICS);

    await AsyncStorage.multiSet([
      [STORAGE_TOKEN_KEY, data.token],
      [STORAGE_DENTIST_KEY, JSON.stringify(dentist)],
    ]);

    return dentist;
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setCurrentDentist(null);
    setPatients([]);
    setAppointments([]);
    setAnalytics(EMPTY_ANALYTICS);
    await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_DENTIST_KEY]);
  }, []);

  const updateProfile = useCallback(async (data: Partial<DentistProfile>) => {
    const merged = {
      ...(currentDentist ?? clinicProfile),
      ...data,
    };

    setCurrentDentist(merged);
    setClinicProfile((prev) => ({ ...prev, ...merged }));
    await AsyncStorage.setItem(STORAGE_DENTIST_KEY, JSON.stringify(merged));
  }, [clinicProfile, currentDentist]);

  const addPatient = useCallback(async (data: Omit<Patient, "id" | "createdAt">) => {
    if (!token) throw new Error("Not authenticated");

    const res = await request<{ patient: any }>("/patients", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);

    const patient = toPatient(res.patient);

    setPatients((prev) => [patient, ...prev]);
    setAnalytics((prev) => ({ ...prev, totalPatients: prev.totalPatients + 1 }));

    return patient;
  }, [token]);

  const updatePatient = useCallback(async (id: string, data: Partial<Patient>) => {
    if (!token) throw new Error("Not authenticated");

    const res = await request<{ patient: any }>(`/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token);

    const updated = toPatient(res.patient);

    setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, [token]);

  const deletePatient = useCallback(async (id: string) => {
    if (!token) throw new Error("Not authenticated");

    await request<{ message: string }>(`/patients/${id}`, { method: "DELETE" }, token);

    setPatients((prev) => prev.filter((p) => p.id !== id));
    setAppointments((prev) => prev.filter((a) => a.patientId !== id));
    setAnalytics((prev) => ({
      ...prev,
      totalPatients: Math.max(0, prev.totalPatients - 1),
    }));
  }, [token]);

  const addAppointment = useCallback(async (data: Omit<Appointment, "id" | "createdAt" | "status">) => {
    if (!token) throw new Error("Not authenticated");

    const res = await request<{ appointment: any }>("/appointments", {
      method: "POST",
      body: JSON.stringify({
        patientId: data.patientId,
        date: data.date,
        timeSlot: data.time,
        reason: data.problem,
      }),
    }, token);

    const appointment = toAppointment(res.appointment);

    setAppointments((prev) => [appointment, ...prev]);
    setAnalytics((prev) => ({
      ...prev,
      totalAppointments: prev.totalAppointments + 1,
      pendingAppointments: prev.pendingAppointments + 1,
    }));

    return appointment;
  }, [token]);

  const bookAsCustomer = useCallback(async (data: {
    name: string;
    phone: string;
    problem: string;
    date: string;
    time: string;
  }) => {
    const res = await request<{ appointment: any }>("/book-appointment", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        date: data.date,
        timeSlot: data.time,
        reason: data.problem,
      }),
    });

    const appointment = toAppointment(res.appointment);

    if (token) {
      await fetchProtectedData(token);
    }

    return appointment;
  }, [fetchProtectedData, token]);

  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment["status"]) => {
    if (!token) throw new Error("Not authenticated");

    const res = await request<{ appointment: any }>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, token);

    const updated = toAppointment(res.appointment);

    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));

    if (token) {
      const analyticsRes = await request<AnalyticsSummary>("/analytics", {}, token);
      setAnalytics(analyticsRes);
    }
  }, [token]);

  const deleteAppointment = useCallback(async (id: string) => {
    if (!token) throw new Error("Not authenticated");

    await request<{ message: string }>(`/appointments/${id}`, { method: "DELETE" }, token);
    setAppointments((prev) => prev.filter((a) => a.id !== id));

    if (token) {
      const analyticsRes = await request<AnalyticsSummary>("/analytics", {}, token);
      setAnalytics(analyticsRes);
    }
  }, [token]);

  const getAvailableSlots = useCallback(async (date: string) => {
    const data = await request<{ slots: string[] }>(`/available-slots?date=${encodeURIComponent(date)}`);
    return data.slots ?? [];
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      isLoading,
      currentDentist,
      clinicProfile,
      patients,
      appointments,
      analytics,
      login,
      signup,
      logout,
      updateProfile,
      addPatient,
      updatePatient,
      deletePatient,
      addAppointment,
      bookAsCustomer,
      updateAppointmentStatus,
      deleteAppointment,
      getAvailableSlots,
      refreshAll,
    }),
    [
      addAppointment,
      addPatient,
      analytics,
      appointments,
      bookAsCustomer,
      clinicProfile,
      currentDentist,
      deleteAppointment,
      deletePatient,
      getAvailableSlots,
      isLoading,
      login,
      logout,
      patients,
      refreshAll,
      signup,
      updateAppointmentStatus,
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
