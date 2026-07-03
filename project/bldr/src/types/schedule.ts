// Schedule related types
// Matches the 'allschedules', 'schedule_classes', and 'userschedule' tables
import type { ClassSection } from "./class";

/**
 * Represents a schedule record from the allschedules table
 */
export interface AllSchedulesRecord {
  scheduleid: string; // uuid (PK)
  schedulename: string; // text (NOT NULL)
  semester: string; // character varying (NOT NULL)
  year: number; // integer (NOT NULL, > 1900)
  is_public: boolean; // boolean (default false)
  createdat?: Date | string; // timestamp (default CURRENT_TIMESTAMP)
  lastedited?: Date | string; // timestamp (default CURRENT_TIMESTAMP)
}

/**
 * Represents a schedule-class relationship from the schedule_classes table
 */
export interface ScheduleClassesRecord {
  scheduleid: string; // uuid (FK to allschedules)
  class_uuid: string; // uuid (FK to allclasses)
  added_at?: Date | string; // timestamp (default CURRENT_TIMESTAMP)
}

/**
 * Represents a busy block record from the schedule_busyblocks table
 */
export interface BusyBlockRecord {
  uuid: string; // uuid (PK)
  scheduleid: string; // uuid (FK to allschedules)
  day: string; // single-day abbreviation: 'M', 'Tu', 'W', 'Th', 'F'
  starttime: string; // 24-hour "HH:MM", 15-minute increments
  endtime: string; // 24-hour "HH:MM", 15-minute increments
  label: string; // display label, defaults to "Busy"
  created_at?: Date | string; // timestamp (default CURRENT_TIMESTAMP)
}

/**
 * Busy block object used in the frontend
 */
export interface BusyBlock {
  uuid: string;
  day: string; // single-day abbreviation: 'M', 'Tu', 'W', 'Th', 'F'
  starttime: string; // 24-hour "HH:MM"
  endtime: string; // 24-hour "HH:MM"
  label: string;
}

/**
 * Represents a user-schedule relationship from the userschedule table
 */
export interface UserScheduleRecord {
  auth_user_id: string; // uuid (FK to auth.users) - Supabase user ID
  scheduleid: string; // uuid (PK, FK to allschedules)
  isactive: boolean; // boolean (default false)
}

/**
 * Schedule object used in the frontend
 */
export interface Schedule {
  id: string; // Maps to scheduleid
  name: string; // Maps to schedulename
  semester: string;
  year: number | string; // Can be number from DB or string in UI
  classes: ClassSection[]; // List of class sections in this schedule
  busyBlocks?: BusyBlock[]; // User-defined busy time blocks in this schedule
  isActive?: boolean; // Maps to isactive from userschedule
  isPublic?: boolean; // Maps to is_public from allschedules
  createdAt?: Date | string; // Maps to createdat
  updatedAt?: Date | string; // Maps to lastedited
}

/**
 * Legacy UserSchedule interface (keeping for backward compatibility)
 */
export interface UserSchedule {
  onlineid: string;
  scheduleid: string;
  isactive: boolean;
  user_id?: string; // Deprecated field
}

/**
 * Request body for creating a new schedule
 */
export interface CreateScheduleRequest {
  scheduleName: string;
  semester: string;
  year: number | string;
}

/**
 * Response from createSchedule API
 */
export interface CreateScheduleResponse {
  schedule: AllSchedulesRecord;
  userSchedule: UserScheduleRecord;
}
