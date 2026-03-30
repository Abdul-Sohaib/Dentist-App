import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Dentist {
  id: string;
  name: string;
  clinic: string;
  location: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: number;
  email: string;
  password: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[];
  slotDuration: number;
  breaks: { start: string; end: string }[];
  bio: string;
  phone: string;
}

export interface Appointment {
  id: string;
  dentistId: string;
  customerName: string;
  customerPhone: string;
  problem?: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string;
}

export interface DentistSession {
  dentist: Dentist;
}

interface AppContextType {
  dentists: Dentist[];
  appointments: Appointment[];
  currentDentist: Dentist | null;
  login: (email: string, password: string) => Dentist | null;
  logout: () => void;
  signup: (data: Omit<Dentist, "id">) => Dentist;
  bookAppointment: (
    data: Omit<Appointment, "id" | "createdAt" | "status">
  ) => Appointment;
  updateAppointmentStatus: (
    id: string,
    status: Appointment["status"]
  ) => void;
  getAvailableSlots: (dentistId: string, date: string) => string[];
  updateDentistProfile: (id: string, data: Partial<Dentist>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const SEED_DENTISTS: Dentist[] = [
  {
    id: "d1",
    name: "Dr. Sarah Mitchell",
    clinic: "BrightSmile Dental Clinic",
    location: "Manhattan, New York",
    specialty: "General & Cosmetic Dentistry",
    rating: 4.9,
    reviewCount: 218,
    experience: 12,
    email: "sarah@brightsmile.com",
    password: "password123",
    workingHours: { start: "09:00", end: "17:00" },
    workingDays: [1, 2, 3, 4, 5],
    slotDuration: 30,
    breaks: [{ start: "13:00", end: "14:00" }],
    bio: "Specializing in cosmetic and restorative dental care with a gentle approach.",
    phone: "+1 (212) 555-0101",
  },
  {
    id: "d2",
    name: "Dr. James Okafor",
    clinic: "ClearPath Orthodontics",
    location: "Brooklyn, New York",
    specialty: "Orthodontics & Braces",
    rating: 4.8,
    reviewCount: 154,
    experience: 9,
    email: "james@clearpath.com",
    password: "password123",
    workingHours: { start: "10:00", end: "18:00" },
    workingDays: [1, 2, 3, 4, 5, 6],
    slotDuration: 45,
    breaks: [{ start: "13:00", end: "14:00" }],
    bio: "Expert in Invisalign, traditional braces, and smile correction for all ages.",
    phone: "+1 (718) 555-0202",
  },
  {
    id: "d3",
    name: "Dr. Priya Sharma",
    clinic: "PediaSmile Kids Dental",
    location: "Hoboken, New Jersey",
    specialty: "Pediatric Dentistry",
    rating: 5.0,
    reviewCount: 89,
    experience: 7,
    email: "priya@pediatrident.com",
    password: "password123",
    workingHours: { start: "08:00", end: "16:00" },
    workingDays: [1, 2, 3, 4, 5],
    slotDuration: 30,
    breaks: [{ start: "12:00", end: "13:00" }],
    bio: "Creating positive, fun dental experiences for children ages 1-18.",
    phone: "+1 (201) 555-0303",
  },
  {
    id: "d4",
    name: "Dr. Marcus Chen",
    clinic: "Midtown Implant Center",
    location: "Midtown, New York",
    specialty: "Implants & Oral Surgery",
    rating: 4.7,
    reviewCount: 312,
    experience: 15,
    email: "marcus@midtownimplant.com",
    password: "password123",
    workingHours: { start: "09:00", end: "17:00" },
    workingDays: [1, 2, 3, 4],
    slotDuration: 60,
    breaks: [{ start: "12:00", end: "13:30" }],
    bio: "Board-certified oral surgeon specializing in dental implants and complex extractions.",
    phone: "+1 (212) 555-0404",
  },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [dentists, setDentists] = useState<Dentist[]>(SEED_DENTISTS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDentist, setCurrentDentist] = useState<Dentist | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedDentists, storedAppointments, storedSession] =
          await Promise.all([
            AsyncStorage.getItem("dentists"),
            AsyncStorage.getItem("appointments"),
            AsyncStorage.getItem("currentDentist"),
          ]);
        if (storedDentists) setDentists(JSON.parse(storedDentists));
        if (storedAppointments)
          setAppointments(JSON.parse(storedAppointments));
        if (storedSession) setCurrentDentist(JSON.parse(storedSession));
      } catch {}
    })();
  }, []);

  const saveDentists = useCallback(async (data: Dentist[]) => {
    await AsyncStorage.setItem("dentists", JSON.stringify(data));
  }, []);

  const saveAppointments = useCallback(async (data: Appointment[]) => {
    await AsyncStorage.setItem("appointments", JSON.stringify(data));
  }, []);

  const login = useCallback(
    (email: string, password: string): Dentist | null => {
      const found = dentists.find(
        (d) =>
          d.email.toLowerCase() === email.toLowerCase() &&
          d.password === password
      );
      if (found) {
        setCurrentDentist(found);
        AsyncStorage.setItem("currentDentist", JSON.stringify(found));
        return found;
      }
      return null;
    },
    [dentists]
  );

  const logout = useCallback(() => {
    setCurrentDentist(null);
    AsyncStorage.removeItem("currentDentist");
  }, []);

  const signup = useCallback(
    (data: Omit<Dentist, "id">): Dentist => {
      const newDentist: Dentist = { ...data, id: generateId() };
      const updated = [...dentists, newDentist];
      setDentists(updated);
      saveDentists(updated);
      setCurrentDentist(newDentist);
      AsyncStorage.setItem("currentDentist", JSON.stringify(newDentist));
      return newDentist;
    },
    [dentists, saveDentists]
  );

  const bookAppointment = useCallback(
    (data: Omit<Appointment, "id" | "createdAt" | "status">): Appointment => {
      const apt: Appointment = {
        ...data,
        id: generateId(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const updated = [...appointments, apt];
      setAppointments(updated);
      saveAppointments(updated);
      return apt;
    },
    [appointments, saveAppointments]
  );

  const updateAppointmentStatus = useCallback(
    (id: string, status: Appointment["status"]) => {
      const updated = appointments.map((a) =>
        a.id === id ? { ...a, status } : a
      );
      setAppointments(updated);
      saveAppointments(updated);
    },
    [appointments, saveAppointments]
  );

  const getAvailableSlots = useCallback(
    (dentistId: string, date: string): string[] => {
      const dentist = dentists.find((d) => d.id === dentistId);
      if (!dentist) return [];

      const d = new Date(date);
      const dayOfWeek = d.getDay();
      if (!dentist.workingDays.includes(dayOfWeek)) return [];

      const slots: string[] = [];
      const start = timeToMinutes(dentist.workingHours.start);
      const end = timeToMinutes(dentist.workingHours.end);
      const duration = dentist.slotDuration;

      for (let t = start; t + duration <= end; t += duration) {
        const slotStart = minutesToTime(t);
        const inBreak = dentist.breaks.some(
          (b) =>
            t >= timeToMinutes(b.start) && t < timeToMinutes(b.end)
        );
        if (inBreak) continue;

        const booked = appointments.some(
          (a) =>
            a.dentistId === dentistId &&
            a.date === date &&
            a.time === slotStart &&
            (a.status === "pending" || a.status === "accepted")
        );
        if (!booked) slots.push(slotStart);
      }

      return slots;
    },
    [dentists, appointments]
  );

  const updateDentistProfile = useCallback(
    (id: string, data: Partial<Dentist>) => {
      const updated = dentists.map((d) =>
        d.id === id ? { ...d, ...data } : d
      );
      setDentists(updated);
      saveDentists(updated);
      if (currentDentist?.id === id) {
        const updatedDentist = { ...currentDentist, ...data };
        setCurrentDentist(updatedDentist);
        AsyncStorage.setItem("currentDentist", JSON.stringify(updatedDentist));
      }
    },
    [dentists, saveDentists, currentDentist]
  );

  return (
    <AppContext.Provider
      value={{
        dentists,
        appointments,
        currentDentist,
        login,
        logout,
        signup,
        bookAppointment,
        updateAppointmentStatus,
        getAvailableSlots,
        updateDentistProfile,
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
