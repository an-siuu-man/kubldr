import { describe, expect, it } from "vitest";
import {
  calculateDuration,
  decimalToTimeString,
  formatDisplayTime,
  formatDisplayTimeRange,
  mapDayAbbreviation,
  parseDays,
  timeToDecimal,
} from "./timeUtils";

// ─── timeToDecimal ────────────────────────────────────────────────────────────

describe("timeToDecimal", () => {
  it("returns 0 for an empty string", () => {
    expect(timeToDecimal("")).toBe(0);
  });

  it("parses 24-hour times", () => {
    expect(timeToDecimal("13:30")).toBe(13.5);
    expect(timeToDecimal("8:00")).toBe(8);
    expect(timeToDecimal("23:45")).toBeCloseTo(23.75, 5);
  });

  it("handles midnight (12 AM → 0)", () => {
    expect(timeToDecimal("12:00 AM")).toBe(0);
  });

  it("handles noon (12 PM → 12)", () => {
    expect(timeToDecimal("12:00 PM")).toBe(12);
  });

  it("converts PM hours correctly (1 PM → 13)", () => {
    expect(timeToDecimal("1:00 PM")).toBe(13);
    expect(timeToDecimal("1:30 PM")).toBeCloseTo(13.5, 5);
  });

  it("converts AM hours correctly (11 AM → 11)", () => {
    expect(timeToDecimal("11:00 AM")).toBe(11);
    expect(timeToDecimal("8:45 AM")).toBeCloseTo(8.75, 5);
  });

  it("handles zero minutes correctly", () => {
    expect(timeToDecimal("9:00")).toBe(9);
    expect(timeToDecimal("9:00 AM")).toBe(9);
  });
});

// ─── display formatting ──────────────────────────────────────────────────────

describe("timeUtils display formatting", () => {
  it("normalizes daily times in 24 hour format", () => {
    expect(formatDisplayTime("9:00", "24h")).toBe("09:00");
    expect(formatDisplayTime("14:30", "24h")).toBe("14:30");
  });

  it("formats daily times in 12 hour format", () => {
    expect(formatDisplayTime("00:00", "12h")).toBe("12:00 AM");
    expect(formatDisplayTime("09:00", "12h")).toBe("9:00 AM");
    expect(formatDisplayTime("12:15", "12h")).toBe("12:15 PM");
    expect(formatDisplayTime("14:30", "12h")).toBe("2:30 PM");
  });

  it("formats time ranges without changing source values", () => {
    expect(formatDisplayTimeRange("09:00", "10:15", "24h")).toBe(
      "09:00 - 10:15",
    );
    expect(formatDisplayTimeRange("09:00", "14:30", "12h")).toBe(
      "9:00 AM - 2:30 PM",
    );
  });

  it("preserves parsing and persistence helpers separately", () => {
    expect(timeToDecimal("2:30 PM")).toBe(14.5);
    expect(decimalToTimeString(14.5)).toBe("14:30");
  });

  it("uses a fallback for missing display times", () => {
    expect(formatDisplayTime("", "12h")).toBe("TBA");
    expect(formatDisplayTimeRange("", "", "24h")).toBe("TBA");
    expect(formatDisplayTimeRange("09:00", "", "12h")).toBe("9:00 AM");
  });
});

// ─── calculateDuration ───────────────────────────────────────────────────────

describe("calculateDuration", () => {
  it("calculates a 1-hour duration", () => {
    expect(calculateDuration("9:00 AM", "10:00 AM")).toBe(1);
  });

  it("calculates a 1.5-hour duration", () => {
    expect(calculateDuration("10:30 AM", "12:00 PM")).toBeCloseTo(1.5, 5);
  });

  it("calculates cross-meridian durations correctly", () => {
    expect(calculateDuration("11:00 AM", "1:00 PM")).toBe(2);
  });

  it("returns 0 for two empty strings (both parse to 0, no exception)", () => {
    // timeToDecimal("") returns 0 (no exception thrown), so 0 - 0 = 0.
    // The catch block that returns 1 is only reachable if the parser throws,
    // which it does not for empty strings.
    expect(calculateDuration("", "")).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // 75 min = 1.25 h
    expect(calculateDuration("8:00 AM", "9:15 AM")).toBe(1.25);
  });
});

// ─── mapDayAbbreviation ───────────────────────────────────────────────────────

describe("mapDayAbbreviation", () => {
  const cases: [string, string][] = [
    ["M", "Monday"],
    ["Tu", "Tuesday"],
    ["W", "Wednesday"],
    ["Th", "Thursday"],
    ["F", "Friday"],
    ["Sa", "Saturday"],
    ["U", "Sunday"],
  ];

  it.each(cases)("maps '%s' to '%s'", (input, expected) => {
    expect(mapDayAbbreviation(input)).toBe(expected);
  });

  it("passes through unknown abbreviations unchanged", () => {
    expect(mapDayAbbreviation("X")).toBe("X");
    expect(mapDayAbbreviation("")).toBe("");
  });
});

// ─── parseDays ───────────────────────────────────────────────────────────────

describe("parseDays", () => {
  it("returns an empty array for an empty string", () => {
    expect(parseDays("")).toEqual([]);
  });

  it("parses a MWF pattern", () => {
    expect(parseDays("MWF")).toEqual(["Monday", "Wednesday", "Friday"]);
  });

  it("parses TuTh — two-char abbreviations take priority over single chars", () => {
    // 'T' alone would be mistaken for Thursday if single-char parsing won
    expect(parseDays("TuTh")).toEqual(["Tuesday", "Thursday"]);
  });

  it("parses a mixed pattern with Saturday (MWFSa)", () => {
    expect(parseDays("MWFSa")).toEqual([
      "Monday",
      "Wednesday",
      "Friday",
      "Saturday",
    ]);
  });

  it("parses a single-day string", () => {
    expect(parseDays("M")).toEqual(["Monday"]);
    expect(parseDays("F")).toEqual(["Friday"]);
  });

  it("parses Tu correctly (not T + u separately)", () => {
    const result = parseDays("Tu");
    expect(result).toEqual(["Tuesday"]);
  });

  it("parses Th correctly (not T + h separately)", () => {
    const result = parseDays("Th");
    expect(result).toEqual(["Thursday"]);
  });

  it("parses Sa correctly", () => {
    expect(parseDays("Sa")).toEqual(["Saturday"]);
  });
});
