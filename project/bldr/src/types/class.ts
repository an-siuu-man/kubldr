// Class and Section related types

/**
 * Represents a class section - used for both UI display and schedule storage
 */
export interface ClassSection {
  uuid: string;
  classID: string; // Maps to classid from database
  dept: string;
  code: string;
  title: string;
  days: string;
  starttime: string;
  endtime: string;
  component: string; // e.g., 'LEC', 'LAB'
  instructor?: string;
  seats_available?: number; // Maps to availseats
  credithours?: number;
  location?: string;
  room?: string;
  pinned?: boolean; // Whether this section is pinned (won't change during permutations)
}

/**
 * Represents grouped class data (multiple sections of the same course)
 */
export interface ClassData {
  dept: string;
  code: string;
  title: string;
  description?: string; // Not in DB, fetched from external API
  sections: ClassSection[];
}

/**
 * Response from getClassInfo API
 */
export interface ClassInfoResponse {
  data: ClassData[];
}

/**
 * Props for the Class component
 */
export interface ClassProps {
  uuid: string;
  dept: string;
  classcode: string;
  onSectionClick?: (section: ClassSection, classData: ClassData) => void;
}

/**
 * Represents a selected class (legacy/simplified format)
 */
export interface SelectedClass {
  classID: string;
  className: string;
  dept: string;
  code: string;
  startTime: string;
  endTime: string;
  days: string;
  instructor?: string;
}

/**
 * Represents a searched class result from the search API
 */
export interface SearchedClass {
  uuid: string;
  code?: string;
  title?: string;
  dept?: string;
  credithours?: number;
  instructor?: string;
  days?: string;
}

/**
 * Represents a class item in the calendar/schedule view
 */
export interface CalendarClassItem {
  uuid?: string; // From allclasses
  classID?: string; // Maps to classid
  days: string;
  startTimeInDecimal: number; // Calculated from starttime
  duration: number; // Calculated from starttime and endtime
  color?: string; // UI-specific
  dept: string;
  code: string;
  title?: string;
  instructor?: string;
  component?: string; // e.g., 'LEC', 'LAB'
  starttime?: string; // Original time string
  endtime?: string; // Original time string
  credithours?: number; // Maps to credithours
  location?: string;
  room?: string;
}
