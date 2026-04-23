import type { ClassSection } from "@/types";

export type SearchClassMeta = {
  dept: string;
  code: string;
  title: string | null;
};

export type ClassDetailRow = {
  uuid: string;
  classid: number;
  days: string | null;
  starttime: string | null;
  endtime: string | null;
  component: string | null;
  instructor: string | null;
  location: string | null;
  room: string | null;
  availseats: number | null;
  minhours: number | null;
  maxhours: number | null;
  searchclass: SearchClassMeta | SearchClassMeta[] | null;
};

/**
 * Normalizes Supabase join results because relationship queries can return
 * either one object or an array depending on generated relationship metadata.
 */
export function pickSearchClassMeta(
  value: SearchClassMeta | SearchClassMeta[] | null,
): SearchClassMeta {
  if (Array.isArray(value)) {
    return value[0] ?? { dept: "", code: "", title: "" };
  }
  return value ?? { dept: "", code: "", title: "" };
}

/**
 * Returns the best available credit-hour value for UI schedule summaries.
 */
export function deriveCreditHours(
  minhours: number | null,
  maxhours: number | null,
) {
  if (typeof maxhours === "number") return maxhours;
  if (typeof minhours === "number") return minhours;
  return undefined;
}

/**
 * Converts a database class row into the ClassSection shape used by the UI.
 */
export function formatClassSection(row: ClassDetailRow): ClassSection {
  const course = pickSearchClassMeta(row.searchclass);

  return {
    uuid: row.uuid,
    classID: row.classid?.toString() || "",
    dept: course.dept,
    code: course.code,
    title: course.title ?? `${course.dept} ${course.code}`,
    days: row.days || "",
    starttime: row.starttime || "",
    endtime: row.endtime || "",
    component: row.component || "",
    instructor: row.instructor || undefined,
    seats_available: row.availseats ?? 0,
    minhours: row.minhours ?? undefined,
    maxhours: row.maxhours ?? undefined,
    credithours: deriveCreditHours(row.minhours, row.maxhours),
    location: row.location || undefined,
    room: row.room || undefined,
  };
}
