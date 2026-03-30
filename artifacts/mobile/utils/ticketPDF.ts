import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export interface TicketData {
  bookingId: string;
  patientName: string;
  phone: string;
  dentistName: string;
  clinicName: string;
  location: string;
  date: string;
  time: string;
  problem?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function buildHTML(data: TicketData): string {
  const displayDate = formatDate(data.date);
  const now = new Date();
  const issuedAt = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Ticket</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F4F8FC;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 40px 20px;
    }

    .ticket {
      width: 100%;
      max-width: 560px;
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(26, 127, 212, 0.12);
      border: 1px solid #E0EAEF;
    }

    .header {
      background: linear-gradient(135deg, #1A7FD4 0%, #0F5FA8 100%);
      padding: 36px 40px 30px;
      position: relative;
    }

    .header-badge {
      display: inline-block;
      background: rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.9);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 20px;
      margin-bottom: 14px;
    }

    .clinic-name {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .clinic-location {
      color: rgba(255,255,255,0.75);
      font-size: 13px;
      font-weight: 400;
    }

    .header-accent {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }

    .header-accent2 {
      position: absolute;
      bottom: -40px;
      right: 40px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }

    .booking-id-bar {
      background: #EBF5FF;
      padding: 14px 40px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #E0EAEF;
    }

    .booking-id-label {
      color: #556070;
      font-size: 12px;
      font-weight: 500;
    }

    .booking-id-value {
      color: #1A7FD4;
      font-size: 14px;
      font-weight: 700;
      font-family: monospace;
      letter-spacing: 1px;
    }

    .body {
      padding: 28px 40px;
    }

    .patient-section {
      margin-bottom: 24px;
    }

    .patient-name {
      font-size: 22px;
      font-weight: 800;
      color: #0D1117;
      margin-bottom: 4px;
    }

    .patient-phone {
      color: #556070;
      font-size: 14px;
      font-weight: 400;
    }

    .divider {
      height: 1px;
      background: linear-gradient(to right, #E0EAEF, transparent);
      margin: 20px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-item {}

    .info-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #98A5B3;
      margin-bottom: 5px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #0D1117;
    }

    .info-value.highlight {
      color: #1A7FD4;
      font-size: 20px;
      font-weight: 800;
    }

    .appointment-highlight {
      background: #EBF5FF;
      border-radius: 16px;
      padding: 20px;
      margin: 8px 0 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid rgba(26,127,212,0.15);
    }

    .apt-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #1A7FD4;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .apt-icon svg { display: block; }

    .apt-date {
      font-size: 16px;
      font-weight: 700;
      color: #0D1117;
      margin-bottom: 3px;
    }

    .apt-time {
      font-size: 24px;
      font-weight: 800;
      color: #1A7FD4;
    }

    .problem-box {
      background: #F4F8FC;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }

    .problem-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #98A5B3;
      margin-bottom: 5px;
    }

    .problem-text {
      font-size: 14px;
      color: #556070;
      line-height: 1.5;
    }

    .tear-line {
      display: flex;
      align-items: center;
      gap: 0;
      margin: 0 -1px;
    }

    .tear-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #F4F8FC;
      border: 1px solid #E0EAEF;
      flex-shrink: 0;
    }

    .tear-dashes {
      flex: 1;
      border-top: 2px dashed #E0EAEF;
    }

    .footer {
      padding: 20px 40px 28px;
      text-align: center;
    }

    .footer-note {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ECFDF5;
      color: #10B981;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 20px;
      margin-bottom: 14px;
    }

    .footer-issued {
      color: #98A5B3;
      font-size: 12px;
    }

    .powered {
      margin-top: 8px;
      color: #C0CEDB;
      font-size: 11px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="ticket">

    <div class="header">
      <div class="header-accent"></div>
      <div class="header-accent2"></div>
      <div class="header-badge">Appointment Ticket</div>
      <div class="clinic-name">${data.clinicName}</div>
      <div class="clinic-location">${data.location}</div>
    </div>

    <div class="booking-id-bar">
      <span class="booking-id-label">Booking ID</span>
      <span class="booking-id-value">#${data.bookingId.toUpperCase()}</span>
    </div>

    <div class="body">
      <div class="patient-section">
        <div class="patient-name">${data.patientName}</div>
        <div class="patient-phone">${data.phone}</div>
      </div>

      <div class="divider"></div>

      <div class="appointment-highlight">
        <div class="apt-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" stroke-width="2"/>
            <path d="M3 9H21" stroke="white" stroke-width="2"/>
            <path d="M8 2L8 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <path d="M16 2L16 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <div class="apt-date">${displayDate}</div>
          <div class="apt-time">${data.time}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Dentist</div>
          <div class="info-value">${data.dentistName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Clinic</div>
          <div class="info-value">${data.clinicName}</div>
        </div>
      </div>

      ${data.problem ? `
      <div class="problem-box">
        <div class="problem-label">Reason for Visit</div>
        <div class="problem-text">${data.problem}</div>
      </div>
      ` : ""}

    </div>

    <div class="tear-line">
      <div class="tear-circle" style="margin-left: -12px;"></div>
      <div class="tear-dashes"></div>
      <div class="tear-circle" style="margin-right: -12px;"></div>
    </div>

    <div class="footer">
      <div class="footer-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2"/><path d="M12 8v4l2.5 2.5" stroke="#10B981" stroke-width="2" stroke-linecap="round"/></svg>
        Please arrive 10 minutes before your appointment
      </div>
      <div class="footer-issued">Issued on ${issuedAt}</div>
      <div class="powered">DentBook · Your smile, expertly scheduled</div>
    </div>

  </div>
</body>
</html>
  `;
}

export async function downloadAppointmentTicket(data: TicketData): Promise<void> {
  const html = buildHTML(data);

  if (Platform.OS === "web") {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Save your Appointment Ticket",
      UTI: "com.adobe.pdf",
    });
  } else {
    await Print.printAsync({ uri });
  }
}
