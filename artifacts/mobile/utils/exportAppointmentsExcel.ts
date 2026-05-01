import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import type { Appointment, Patient } from "@/context/AppContext";

const formatStatus = (status: Appointment["status"]) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
};

const getPatientDetails = (appointment: Appointment, patients: Patient[]) => {
  const patient = patients.find((item) => item.id === appointment.patientId);

  return {
    patientName: patient?.name ?? appointment.bookedForName ?? "Unknown",
    age: patient?.age ?? "",
    phoneNumber: patient?.phone ?? appointment.bookedForPhone ?? "",
  };
};

export async function exportAppointmentsExcel(params: {
  date: string;
  appointments: Appointment[];
  patients: Patient[];
}) {
  const { date, appointments, patients } = params;
  const rows = appointments.map((appointment) => {
    const patient = getPatientDetails(appointment, patients);

    return {
      "Patient Name": patient.patientName,
      Age: patient.age,
      "Phone Number": patient.phoneNumber,
      Issue: appointment.problem || "",
      "Time Booked": appointment.time || "",
      Status: formatStatus(appointment.status),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 24 },
    { wch: 8 },
    { wch: 18 },
    { wch: 36 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");

  const fileName = `dentbook-patients-${date}.xlsx`;

  if (Platform.OS === "web") {
    XLSX.writeFile(workbook, fileName);
    return;
  }

  const base64 = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(base64, { encoding: "base64" });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: "Export patient appointments",
    UTI: "com.microsoft.excel.xlsx",
  });
}
