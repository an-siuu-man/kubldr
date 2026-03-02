/**
 * API Route: /api/createSchedule
 * 
 * Creates a new schedule for the authenticated user.
 * Inserts a record in allschedules and links it to the user via userschedule.
 * 
 * @method POST
 * @requires Authentication via Supabase session cookies
 * @body {
 *   scheduleName: string,  // Name for the new schedule
 *   semester: string,      // Semester (e.g., "Spring 2026")
 *   year: number           // Academic year
 * }
 * 
 * @returns { schedule: object, userSchedule: object } - The created schedule and link
 * 
 * @throws 401 - Unauthorized (not logged in)
 * @throws 500 - Database error during creation
 */
import { createClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

/**
 * POST handler for creating a new schedule.
 * Uses server-side Supabase client to get authenticated user.
 * Creates schedule and links it to the user in a two-step process.
 * 
 * @param {Request} req - The incoming request with schedule details
 * @returns {Response} JSON response with created schedule or error
 */
export async function POST(req: Request) {
  // Extract schedule details from request body
  const { scheduleName, semester, year } = await req.json();

  // Create server-side Supabase client with user's session
  const supabase = await createClient();

  // Get the authenticated user from the session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error:", authError);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 1: Insert new schedule into allschedules table
  const { data: sched, error: e1 } = await supabase
    .from("allschedules")
    .insert({
      scheduleid: uuid(),
      schedulename: scheduleName,
      semester: semester,
      year: year,
    })
    .select()
    .single();

  if (e1) {
    console.error("Error creating schedule:", e1);
    return Response.json({ error: e1.message, details: e1 }, { status: 500 });
  }

  // Step 2: Link schedule to user in userschedule table
  const { data: link, error: e2 } = await supabase
    .from("userschedule")
    .insert({
      scheduleid: sched.scheduleid,
      isactive: true,
      auth_user_id: user.id,
    })
    .select()
    .single();

  if (e2) {
    console.error("Error linking user schedule:", e2);
    return Response.json({ error: e2.message, details: e2 }, { status: 500 });
  }

  return Response.json({ schedule: sched, userSchedule: link });
}
