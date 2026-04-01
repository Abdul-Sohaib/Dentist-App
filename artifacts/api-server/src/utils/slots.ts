export const toMinutes = (time: string): number => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export const toTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

export interface TimeRange {
  start: string;
  end: string;
}

export const generateSlots = (params: {
  workingHours: TimeRange;
  slotDuration: number;
  breakTimes: TimeRange[];
}) => {
  const { workingHours, slotDuration, breakTimes } = params;

  const startMinutes = toMinutes(workingHours.start);
  const endMinutes = toMinutes(workingHours.end);
  const slots: string[] = [];

  for (let current = startMinutes; current + slotDuration <= endMinutes; current += slotDuration) {
    const inBreak = breakTimes.some((range) => {
      const breakStart = toMinutes(range.start);
      const breakEnd = toMinutes(range.end);
      return current >= breakStart && current < breakEnd;
    });

    if (!inBreak) {
      slots.push(toTime(current));
    }
  }

  return slots;
};
