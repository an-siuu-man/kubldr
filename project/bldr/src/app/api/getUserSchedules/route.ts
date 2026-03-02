/**
 * API Route: /api/getUserSchedules
 * 
 * Fetches all schedules belonging to the authenticated user.
 * For each schedule, also retrieves the associated class sections
 * with full details including times, instructor, and room info.
 * 
 * @method GET
 * @requires Authorization header with Bearer token
 * @returns { schedules: Array<ScheduleWithClasses> }
 * 
 * Each schedule includes:
 * - id, name, semester, year
 * - createdAt, updatedAt timestamps
 * - classes: Array of ClassSection objects
 * 
 * @throws 401 - Unauthorized (missing/invalid auth header)
 * @throws 500 - Database error
 */
import { supabase } from "../../lib/supabaseClient";
import { NextRequest } from "next/server";

/**
 * GET handler for fetching all user schedules with their classes.
 * Performs a multi-step query:
 * 1. Get schedule IDs linked to user
 * 2. Fetch schedule metadata
 * 3. For each schedule, fetch its class sections
 * 
 * @param {NextRequest} req - The incoming request
 * @returns {Response} JSON with array of schedules
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and validate authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    // Verify user authentication with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Get schedule IDs linked to this user (active only)
    const { data: userScheduleData, error: userScheduleError } = await supabase
      .from("userschedule")
      .select("scheduleid")
      .eq("auth_user_id", user.id)
      .eq("isactive", true);

    if (userScheduleError) {
      console.error(
        "[getUserSchedules] Error fetching user schedules:",
        userScheduleError
      );
      return Response.json(
        { error: "Failed to fetch user schedules" },
        { status: 500 }
      );
    }

    // Return empty array if user has no schedules
    if (!userScheduleData || userScheduleData.length === 0) {
      return Response.json({ schedules: [] });
    }

    // Step 2: Fetch schedule metadata from allschedules
    const scheduleIds = userScheduleData.map((us: any) => us.scheduleid);
    const { data: schedules, error: schedulesError } = await supabase
      .from("allschedules")
      .select("scheduleid, schedulename, semester, year, createdat, lastedited")
      .in("scheduleid", scheduleIds)
      .order("createdat", { ascending: false });

    if (schedulesError) {
      return Response.json(
        { error: "Failed to fetch schedule details" },
        { status: 500 }
      );
    }

    // Step 3: For each schedule, fetch its class sections
    const schedulesWithClasses = await Promise.all(
      (schedules || []).map(async (schedule: any) => {
        // Get class UUIDs for this schedule
        const { data: scheduleClasses, error: classesError } = await supabase
          .from("schedule_classes")
          .select("class_uuid")
          .eq("scheduleid", schedule.scheduleid);

        if (classesError) {
          console.error(
            `[getUserSchedules] Error fetching classes for schedule ${schedule.scheduleid}:`,
            classesError
          );
          return {
            id: schedule.scheduleid,
            name: schedule.schedulename,
            semester: schedule.semester,
            year: schedule.year,
            classes: [],
            createdAt: schedule.createdat,
            updatedAt: schedule.lastedited,
          };
        }

        // Return schedule with empty classes if none found
        if (!scheduleClasses || scheduleClasses.length === 0) {
          return {
            id: schedule.scheduleid,
            name: schedule.schedulename,
            semester: schedule.semester,
            year: schedule.year,
            classes: [],
            createdAt: schedule.createdat,
            updatedAt: schedule.lastedited,
          };
        }

        // Fetch full class details from allclasses
        const classUuids = scheduleClasses.map((sc: any) => sc.class_uuid);
        const { data: classDetails, error: detailsError } = await supabase
          .from("allclasses")
          .select(
            "uuid, classid, dept, code, title, days, starttime, endtime, component, instructor, credithours, location, room, availseats"
          )
          .in("uuid", classUuids);

        if (detailsError) {
          console.error(
            `[getUserSchedules] Error fetching class details:`,
            detailsError
          );
          return {
            id: schedule.scheduleid,
            name: schedule.schedulename,
            semester: schedule.semester,
            year: schedule.year,
            classes: [],
            createdAt: schedule.createdat,
            updatedAt: schedule.lastedited,
          };
        }

        // Format classes to match ClassSection type expected by frontend
        const formattedClasses = (classDetails || []).map((cls: any) => ({
          uuid: cls.uuid,
          classID: cls.classid?.toString() || "",
          dept: cls.dept,
          code: cls.code,
          title: cls.title,
          days: cls.days || "",
          starttime: cls.starttime || "",
          endtime: cls.endtime || "",
          component: cls.component || "",
          instructor: cls.instructor,
          seats_available: cls.availseats,
          credithours: cls.credithours,
          location: cls.location,
          room: cls.room,
        }));

        return {
          id: schedule.scheduleid,
          name: schedule.schedulename,
          semester: schedule.semester,
          year: schedule.year,
          classes: formattedClasses,
          createdAt: schedule.createdat,
          updatedAt: schedule.lastedited,
        };
      })
    );

    return Response.json({ schedules: schedulesWithClasses });
  } catch (error) {
    console.error("[getUserSchedules] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
