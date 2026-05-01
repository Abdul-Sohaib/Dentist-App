const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const buildAppointmentDateTime = (date: string, timeSlot: string) => {
  const normalizedTime = /^\d{2}:\d{2}$/.test(timeSlot) ? timeSlot : "00:00";
  const [year, month, day] = date.split("-").map((piece) => Number(piece));
  const [hours, minutes] = normalizedTime.split(":").map((piece) => Number(piece));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return new Date(`${date}T${normalizedTime}:00`);
  }

  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS);
};

export const getReminderWindow = (now = new Date()) => {
  const windowStart = new Date(now.getTime() + 29 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 31 * 60 * 1000);

  return { windowStart, windowEnd };
};
