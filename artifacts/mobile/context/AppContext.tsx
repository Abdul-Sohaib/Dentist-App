import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface DentistProfile {
  id: string;
  name: string;
  clinicName: string;
  location: string;
  phone: string;
  email: string;
  password: string;
  workingHours: { start: string; end: string };
  workingDays: number[];
  slotDuration: number;
  breaks: { start: string; end: string }[];
  bio: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
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

interface AppContextType {
  isLoading: boolean;
  currentDentist: DentistProfile | null;
  patients: Patient[];
  appointments: Appointment[];
  login: (email: string, password: string) => DentistProfile | null;
  signup: (data: Omit<DentistProfile, "id">) => DentistProfile;
  logout: () => void;
  updateProfile: (data: Partial<DentistProfile>) => void;
  addPatient: (data: Omit<Patient, "id" | "createdAt">) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addAppointment: (data: Omit<Appointment, "id" | "createdAt" | "status">) => Appointment;
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  deleteAppointment: (id: string) => void;
  getAvailableSlots: (date: string) => string[];
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

function relativeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

const DEMO_DENTIST: DentistProfile = {
  id: "demo-dentist",
  name: "Dr. Sarah Mitchell",
  clinicName: "BrightSmile Dental Clinic",
  location: "Manhattan, New York",
  phone: "+1 (212) 555-0101",
  email: "demo@dentbook.com",
  password: "demo123",
  workingHours: { start: "09:00", end: "17:00" },
  workingDays: [1, 2, 3, 4, 5],
  slotDuration: 30,
  breaks: [{ start: "13:00", end: "14:00" }],
  bio: "Specializing in cosmetic and restorative dental care with a gentle, patient-first approach.",
};

const DEMO_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "John Anderson",
    phone: "+1 (555) 234-5678",
    notes: "Severe tooth pain, lower right molar. Allergic to penicillin.",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "p2",
    name: "Emma Williams",
    phone: "+1 (555) 345-6789",
    notes: "Routine checkup. Has dental anxiety, needs extra care.",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "p3",
    name: "Michael Brown",
    phone: "+1 (555) 456-7890",
    notes: "Teeth whitening treatment. No known allergies.",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "p4",
    name: "Sophia Johnson",
    phone: "+1 (555) 567-8901",
    notes: "Braces consultation and follow-up. Teenager patient.",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "p5",
    name: "Daniel Davis",
    phone: "+1 (555) 678-9012",
    notes: "Wisdom tooth extraction. Previously done under local anesthesia.",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "p6",
    name: "Olivia Martinez",
    phone: "+1 (555) 789-0123",
    notes: "Routine cleaning and X-ray. Healthy patient.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    patientId: "p1",
    date: relativeDate(0),
    time: "09:00",
    problem: "Tooth pain - lower right molar",
    status: "confirmed",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "a2",
    patientId: "p2",
    date: relativeDate(0),
    time: "10:00",
    problem: "Routine checkup and cleaning",
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "a3",
    patientId: "p3",
    date: relativeDate(0),
    time: "11:00",
    problem: "Teeth whitening session 2",
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "a4",
    patientId: "p4",
    date: relativeDate(1),
    time: "09:30",
    problem: "Braces adjustment",
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "a5",
    patientId: "p5",
    date: relativeDate(2),
    time: "14:00",
    problem: "Wisdom tooth consultation",
    status: "confirmed",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "a6",
    patientId: "p6",
    date: relativeDate(3),
    time: "10:30",
    problem: "Routine cleaning",
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "a7",
    patientId: "p1",
    date: relativeDate(-7),
    time: "09:00",
    problem: "Initial consultation for tooth pain",
    status: "completed",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "a8",
    patientId: "p3",
    date: relativeDate(-5),
    time: "11:00",
    problem: "Teeth whitening session 1",
    status: "completed",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "a9",
    patientId: "p2",
    date: relativeDate(-3),
    time: "14:30",
    problem: "Follow-up checkup",
    status: "cancelled",
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentDentist, setCurrentDentist] = useState<DentistProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [storedDentist, storedPatients, storedAppointments] = await Promise.all([
          AsyncStorage.getItem("currentDentist"),
          AsyncStorage.getItem("patients"),
          AsyncStorage.getItem("appointments"),
        ]);
        if (storedDentist) setCurrentDentist(JSON.parse(storedDentist));
        if (storedPatients) setPatients(JSON.parse(storedPatients));
        if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const persist = useCallback(async (
    dentist: DentistProfile | null,
    pts: Patient[],
    apts: Appointment[]
  ) => {
    const ops = [
      AsyncStorage.setItem("patients", JSON.stringify(pts)),
      AsyncStorage.setItem("appointments", JSON.stringify(apts)),
    ];
    if (dentist) {
      ops.push(AsyncStorage.setItem("currentDentist", JSON.stringify(dentist)));
    } else {
      ops.push(AsyncStorage.removeItem("currentDentist"));
    }
    await Promise.all(ops);
  }, []);

  const login = useCallback((email: string, password: string): DentistProfile | null => {
    const isDemo =
      email.trim().toLowerCase() === DEMO_DENTIST.email &&
      password === DEMO_DENTIST.password;

    if (isDemo) {
      setCurrentDentist(DEMO_DENTIST);
      const pts = DEMO_PATIENTS;
      const apts = DEMO_APPOINTMENTS;
      setPatients(pts);
      setAppointments(apts);
      persist(DEMO_DENTIST, pts, apts);
      return DEMO_DENTIST;
    }
    return null;
  }, [persist]);

  const signup = useCallback((data: Omit<DentistProfile, "id">): DentistProfile => {
    const dentist: DentistProfile = { ...data, id: generateId() };
    setCurrentDentist(dentist);
    setPatients([]);
    setAppointments([]);
    persist(dentist, [], []);
    return dentist;
  }, [persist]);

  const logout = useCallback(() => {
    setCurrentDentist(null);
    setPatients([]);
    setAppointments([]);
    AsyncStorage.multiRemove(["currentDentist", "patients", "appointments"]);
  }, []);

  const updateProfile = useCallback((data: Partial<DentistProfile>) => {
    setCurrentDentist((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      AsyncStorage.setItem("currentDentist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addPatient = useCallback((data: Omit<Patient, "id" | "createdAt">): Patient => {
    const patient: Patient = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setPatients((prev) => {
      const updated = [patient, ...prev];
      AsyncStorage.setItem("patients", JSON.stringify(updated));
      return updated;
    });
    return patient;
  }, []);

  const updatePatient = useCallback((id: string, data: Partial<Patient>) => {
    setPatients((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...data } : p));
      AsyncStorage.setItem("patients", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem("patients", JSON.stringify(updated));
      return updated;
    });
    setAppointments((prev) => {
      const updated = prev.filter((a) => a.patientId !== id);
      AsyncStorage.setItem("appointments", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addAppointment = useCallback((
    data: Omit<Appointment, "id" | "createdAt" | "status">
  ): Appointment => {
    const apt: Appointment = {
      ...data,
      id: generateId(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => {
      const updated = [apt, ...prev];
      AsyncStorage.setItem("appointments", JSON.stringify(updated));
      return updated;
    });
    return apt;
  }, []);

  const updateAppointmentStatus = useCallback(
    (id: string, status: Appointment["status"]) => {
      setAppointments((prev) => {
        const updated = prev.map((a) => (a.id === id ? { ...a, status } : a));
        AsyncStorage.setItem("appointments", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      AsyncStorage.setItem("appointments", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getAvailableSlots = useCallback(
    (date: string): string[] => {
      if (!currentDentist) return [];
      const d = new Date(date + "T00:00:00");
      const dayOfWeek = d.getDay();
      if (!currentDentist.workingDays.includes(dayOfWeek)) return [];

      const slots: string[] = [];
      const start = timeToMinutes(currentDentist.workingHours.start);
      const end = timeToMinutes(currentDentist.workingHours.end);
      const duration = currentDentist.slotDuration;

      for (let t = start; t + duration <= end; t += duration) {
        const slotStart = minutesToTime(t);
        const inBreak = currentDentist.breaks.some(
          (b) => t >= timeToMinutes(b.start) && t < timeToMinutes(b.end)
        );
        if (inBreak) continue;
        const booked = appointments.some(
          (a) =>
            a.date === date &&
            a.time === slotStart &&
            (a.status === "pending" || a.status === "confirmed")
        );
        if (!booked) slots.push(slotStart);
      }
      return slots;
    },
    [currentDentist, appointments]
  );

  return (
    <AppContext.Provider
      value={{
        isLoading,
        currentDentist,
        patients,
        appointments,
        login,
        signup,
        logout,
        updateProfile,
        addPatient,
        updatePatient,
        deletePatient,
        addAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        getAvailableSlots,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
