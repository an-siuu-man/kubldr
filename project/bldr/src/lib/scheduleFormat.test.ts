import { describe, expect, it } from "vitest";
import {
  type ClassDetailRow,
  deriveCreditHours,
  formatClassSection,
  pickSearchClassMeta,
  type SearchClassMeta,
} from "./scheduleFormat";

// ─── pickSearchClassMeta ──────────────────────────────────────────────────────

describe("pickSearchClassMeta", () => {
  it("returns the value directly when given a single object", () => {
    const meta: SearchClassMeta = { dept: "EECS", code: "101", title: "Intro" };
    expect(pickSearchClassMeta(meta)).toEqual(meta);
  });

  it("returns the first element when given a non-empty array", () => {
    const meta: SearchClassMeta = {
      dept: "MATH",
      code: "220",
      title: "Calculus",
    };
    expect(
      pickSearchClassMeta([
        meta,
        { dept: "PHYS", code: "211", title: "Physics" },
      ]),
    ).toEqual(meta);
  });

  it("returns empty-string defaults when given an empty array", () => {
    expect(pickSearchClassMeta([])).toEqual({ dept: "", code: "", title: "" });
  });

  it("returns empty-string defaults when given null", () => {
    expect(pickSearchClassMeta(null)).toEqual({
      dept: "",
      code: "",
      title: "",
    });
  });
});

// ─── deriveCreditHours ────────────────────────────────────────────────────────

describe("deriveCreditHours", () => {
  it("prefers maxhours over minhours", () => {
    expect(deriveCreditHours(2, 3)).toBe(3);
  });

  it("falls back to minhours when maxhours is null", () => {
    expect(deriveCreditHours(1, null)).toBe(1);
  });

  it("returns undefined when both are null", () => {
    expect(deriveCreditHours(null, null)).toBeUndefined();
  });

  it("returns maxhours = 0 (falsy number) correctly — not undefined", () => {
    // 0 is a valid number, typeof 0 === 'number'
    expect(deriveCreditHours(1, 0)).toBe(0);
  });
});

// ─── formatClassSection ───────────────────────────────────────────────────────

describe("formatClassSection", () => {
  function makeRow(overrides: Partial<ClassDetailRow> = {}): ClassDetailRow {
    return {
      uuid: "test-uuid",
      classid: 42,
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
      component: "LEC",
      instructor: "Smith, J.",
      location: "Eaton Hall",
      room: "101",
      availseats: 15,
      minhours: 3,
      maxhours: 3,
      searchclass: { dept: "EECS", code: "101", title: "Intro to CS" },
      ...overrides,
    };
  }

  it("maps all fields from a complete row", () => {
    const section = formatClassSection(makeRow());
    expect(section.uuid).toBe("test-uuid");
    expect(section.classID).toBe("42");
    expect(section.dept).toBe("EECS");
    expect(section.code).toBe("101");
    expect(section.title).toBe("Intro to CS");
    expect(section.days).toBe("MWF");
    expect(section.starttime).toBe("9:00 AM");
    expect(section.endtime).toBe("10:00 AM");
    expect(section.component).toBe("LEC");
    expect(section.instructor).toBe("Smith, J.");
    expect(section.seats_available).toBe(15);
    expect(section.credithours).toBe(3);
    expect(section.location).toBe("Eaton Hall");
    expect(section.room).toBe("101");
  });

  it("falls back to 'DEPT CODE' title when title is null", () => {
    const section = formatClassSection(
      makeRow({ searchclass: { dept: "EECS", code: "101", title: null } }),
    );
    expect(section.title).toBe("EECS 101");
  });

  it("defaults seats_available to 0 when availseats is null", () => {
    const section = formatClassSection(makeRow({ availseats: null }));
    expect(section.seats_available).toBe(0);
  });

  it("defaults days to empty string when days is null", () => {
    const section = formatClassSection(makeRow({ days: null }));
    expect(section.days).toBe("");
  });

  it("uses empty strings for null time fields", () => {
    const section = formatClassSection(
      makeRow({ starttime: null, endtime: null }),
    );
    expect(section.starttime).toBe("");
    expect(section.endtime).toBe("");
  });

  it("derives credit hours from minhours when maxhours is null", () => {
    const section = formatClassSection(
      makeRow({ minhours: 2, maxhours: null }),
    );
    expect(section.credithours).toBe(2);
  });

  it("leaves credithours undefined when both hour fields are null", () => {
    const section = formatClassSection(
      makeRow({ minhours: null, maxhours: null }),
    );
    expect(section.credithours).toBeUndefined();
  });

  it("handles searchclass given as an array (Supabase relationship quirk)", () => {
    const row = makeRow({
      searchclass: [{ dept: "PHYS", code: "211", title: "Physics I" }],
    });
    const section = formatClassSection(row);
    expect(section.dept).toBe("PHYS");
    expect(section.code).toBe("211");
    expect(section.title).toBe("Physics I");
  });
});
