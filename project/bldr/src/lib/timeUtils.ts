export type TimeDisplayFormat = "12h" | "24h";

/**
 * Convert time string (e.g., "13:30" or "1:30 PM") to decimal hours
 */
export function timeToDecimal(timeStr: string): number {
  if (!timeStr) return 0;

  // If already in 24-hour format (e.g., "13:30") or missing AM/PM, parse directly
  if (!/AM|PM/i.test(timeStr)) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + (minutes || 0) / 60;
  }

  // Convert from 12-hour format with AM/PM
  const [time, meridian] = timeStr.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (meridian.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }
  if (meridian.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return hours + (minutes || 0) / 60;
}

export function decimalToTimeString(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatDisplayTime(
  timeStr: string | null | undefined,
  format: TimeDisplayFormat,
  fallback = "TBA",
): string {
  if (!timeStr) return fallback;

  const decimal = timeToDecimal(timeStr);
  if (Number.isNaN(decimal)) return fallback;

  const normalized = decimalToTimeString(decimal);
  if (format === "24h") return normalized;

  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatDisplayTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  format: TimeDisplayFormat,
  fallback = "TBA",
): string {
  const start = formatDisplayTime(startTime, format, fallback);
  const end = formatDisplayTime(endTime, format, fallback);

  if (start === fallback && end === fallback) return fallback;
  if (start === fallback) return end;
  if (end === fallback) return start;

  return `${start} - ${end}`;
}

/**
 * Calculate duration in decimal hours between start and end times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  try {
    const start = timeToDecimal(startTime);
    const end = timeToDecimal(endTime);
    return parseFloat((end - start).toFixed(2));
  } catch {
    return 1; // Default to 1 hour if parsing fails
  }
}

/**
 * Map day abbreviations to full day names
 */
export function mapDayAbbreviation(abbr: string): string {
  const dayMap: { [key: string]: string } = {
    M: "Monday",
    Tu: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
    Sa: "Saturday",
    U: "Sunday",
  };
  return dayMap[abbr] || abbr;
}

/**
 * Parse days string (e.g., "MWF" or "TuTh") into array of full day names
 */
export function parseDays(daysStr: string): string[] {
  if (!daysStr) return [];

  const days: string[] = [];
  let i = 0;

  while (i < daysStr.length) {
    // Check for two-letter abbreviations first (Tu, Th, Sa)
    if (i + 1 < daysStr.length) {
      const twoChar = daysStr.substring(i, i + 2);
      if (twoChar === "Tu" || twoChar === "Th" || twoChar === "Sa") {
        days.push(mapDayAbbreviation(twoChar));
        i += 2;
        continue;
      }
    }

    // Single-letter abbreviation (M, W, F, U)
    days.push(mapDayAbbreviation(daysStr[i]));
    i++;
  }

  return days.filter(Boolean);
}
