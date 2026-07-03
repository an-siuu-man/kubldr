const TIME_RE = /^(\d{1,2}):(\d{2})$/;

const VALID_BUSY_BLOCK_DAYS = new Set(["M", "Tu", "W", "Th", "F"]);

export function isValidBusyBlockDay(day: string): boolean {
  return VALID_BUSY_BLOCK_DAYS.has(day);
}

export function busyBlockTimeToMinutes(hhmm: string): number | null {
  const match = TIME_RE.exec(hhmm.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function validateBusyBlockTimes(
  starttime: string,
  endtime: string,
): string | null {
  const startMin = busyBlockTimeToMinutes(starttime);
  const endMin = busyBlockTimeToMinutes(endtime);

  if (startMin == null || endMin == null) {
    return "Invalid time format (expected 24-hour HH:MM)";
  }

  if (startMin % 15 !== 0 || endMin % 15 !== 0) {
    return "Times must be on 15-minute increments";
  }

  if (endMin <= startMin) {
    return "endtime must be after starttime";
  }

  return null;
}
