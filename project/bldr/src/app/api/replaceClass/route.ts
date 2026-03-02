/**
 * API Route: /api/replaceClass
 * 
 * Replaces one class with another in a user's schedule.
 * Adds the new class and removes the old class in a single operation.
 * Useful for swapping between different sections of the same course.
 * 
 * @method POST
 * @body {
 *   scheduleid: string,   // UUID of the schedule
 *   fromUuid?: string,    // UUID of class to remove
 *   toUuid?: string,      // UUID of class to add
 *   fromClassId?: number, // Alternative: integer classid to remove
 *   toClassId?: number    // Alternative: integer classid to add
 * }
 * @returns { success: true, message: string, details: object }
 * 
 * @throws 400 - Missing required fields or same source/target
 * @throws 404 - Source or target class not found
 * @throws 500 - Database error during operation
 */
import { supabase } from "../../lib/supabaseClient";

/**
 * Request body type supporting both UUID and classid lookups
 */
type BodyUUID = {
  scheduleid: string;    // UUID of schedule
  fromUuid?: string;     // UUID of class to remove
  toUuid?: string;       // UUID of class to add
  fromClassId?: number;  // Integer classid alternative
  toClassId?: number;    // Integer classid alternative
};

/**
 * POST handler for replacing a class in a schedule.
 * Performs a two-step operation: add new class, then remove old class.
 * 
 * @param {Request} req - The incoming request with class identifiers
 * @returns {Response} JSON response with result or error
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BodyUUID;
    const { scheduleid } = body;

    // --- basic validation ---------------------------------------------------
    if (!scheduleid) {
      return Response.json({ error: "Missing scheduleid" }, { status: 400 });
    }
    if (
      (!body.fromUuid && body.fromClassId == null) ||
      (!body.toUuid && body.toClassId == null)
    ) {
      return Response.json(
        { error: "Provide fromUuid/toUuid OR fromClassId/toClassId" },
        { status: 400 }
      );
    }

    // --- helper: resolve classid (int) from either uuid or classid ----------
    const resolveClassId = async (uuid?: string, classId?: number) => {
      if (classId != null) return classId;

      if (!uuid) return null;

      const { data, error } = await supabase
        .from("allclasses")
        .select("classid")
        .eq("uuid", uuid)
        .maybeSingle();

      if (error)
        throw new Error(`Failed to look up class by uuid: ${error.message}`);
      return data?.classid ?? null;
    };

    const fromClassId = await resolveClassId(body.fromUuid, body.fromClassId);
    const toClassId = await resolveClassId(body.toUuid, body.toClassId);

    if (fromClassId == null) {
      return Response.json(
        { error: "Source class not found" },
        { status: 404 }
      );
    }
    if (toClassId == null) {
      return Response.json(
        { error: "Target class not found" },
        { status: 404 }
      );
    }
    if (fromClassId === toClassId) {
      return Response.json(
        { error: "Source and target class are the same — nothing to replace" },
        { status: 400 }
      );
    }

    // --- step 1: ensure target mapping exists (idempotent) ------------------
    // Uses the UNIQUE(scheduleid,class_uuid) constraint to avoid duplicates.
    // First get the uuid for toClassId
    const { data: toClass, error: toClassErr } = await supabase
      .from("allclasses")
      .select("uuid")
      .eq("classid", toClassId)
      .maybeSingle();

    if (toClassErr || !toClass) {
      return Response.json(
        { error: "Failed to resolve target class uuid" },
        { status: 500 }
      );
    }

    const { error: upsertErr } = await supabase
      .from("schedule_classes")
      .upsert([{ scheduleid, class_uuid: toClass.uuid }], {
        onConflict: "scheduleid,class_uuid",
        ignoreDuplicates: false,
      });

    if (upsertErr) {
      console.error("[replaceClass] upsert error:", upsertErr);
      return Response.json(
        { error: "Failed to add target class to schedule" },
        { status: 500 }
      );
    }

    // --- step 2: remove the old mapping if it exists ------------------------
    // Get the uuid for fromClassId
    const { data: fromClass, error: fromClassErr } = await supabase
      .from("allclasses")
      .select("uuid")
      .eq("classid", fromClassId)
      .maybeSingle();

    if (fromClassErr || !fromClass) {
      // If we can't find the old class, that's okay - it might not be in the schedule
      console.warn(
        "[replaceClass] Could not resolve fromClass uuid, skipping delete"
      );
    } else {
      const { error: delErr, count: deletedOld } = await supabase
        .from("schedule_classes")
        .delete({ count: "exact" })
        .eq("scheduleid", scheduleid)
        .eq("class_uuid", fromClass.uuid);

      if (delErr) {
        console.error("[replaceClass] delete old mapping error:", delErr);
        // roll forward anyway: target is already present, old may not have existed
        return Response.json(
          { error: "Target added, but failed to remove old class" },
          { status: 500 }
        );
      }
    }

    // optional: if nothing was deleted, inform the caller (helps UX)
    const message = "Replaced class in schedule.";

    return Response.json(
      {
        success: true,
        message,
        details: {
          scheduleid,
          fromClassId,
          toClassId,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[replaceClass] server error:", err);
    return Response.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}
