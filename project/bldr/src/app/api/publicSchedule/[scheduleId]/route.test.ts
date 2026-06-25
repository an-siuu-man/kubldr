/**
 * Tests for /api/publicSchedule/[scheduleId] (GET)
 *
 * Verifies the public-exposure gate: only schedules with is_public=true
 * are returned, and non-UUID schedule IDs are rejected immediately.
 * Uses @supabase/supabase-js directly (not the module-level supabaseClient).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock factory ─────────────────────────────────────────────────────────────

type MockResult = { data: unknown; error: unknown };

function makeChain(result: MockResult) {
  const p = Promise.resolve(result);
  // biome-ignore lint/suspicious/noExplicitAny: intentional chainable mock — starts from a real Promise so .then is inherited, not added to a plain object
  const chain: any = Object.assign(p, {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    order: () => chain,
    maybeSingle: () => p,
    single: () => p,
  });
  return chain;
}

// The route calls createClient() from @supabase/supabase-js directly.
const { mockSupabaseInstance } = vi.hoisted(() => ({
  mockSupabaseInstance: {
    from: vi.fn(),
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseInstance),
}));

import { GET } from "./route";

// ─── Test state ───────────────────────────────────────────────────────────────

let fromResponses: MockResult[] = [];
let fromCallIndex = 0;

function get(scheduleId: string) {
  const req = new Request(`http://localhost/api/publicSchedule/${scheduleId}`);
  const context = { params: Promise.resolve({ scheduleId }) };
  return GET(req, context);
}

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const SCHEDULE_ROW = {
  scheduleid: VALID_UUID,
  schedulename: "My Public Schedule",
  semester: "Spring",
  year: 2026,
  createdat: null,
  lastedited: null,
};

beforeEach(() => {
  fromCallIndex = 0;
  fromResponses = [];
  vi.clearAllMocks();
  mockSupabaseInstance.from.mockImplementation((_table: string) =>
    makeChain(fromResponses[fromCallIndex++] ?? { data: null, error: null }),
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/publicSchedule/[scheduleId]", () => {
  it("returns 404 for a non-UUID scheduleId", async () => {
    const res = await get("not-a-uuid");
    expect(res.status).toBe(404);
  });

  it("returns 404 for an empty scheduleId", async () => {
    const res = await get("");
    expect(res.status).toBe(404);
  });

  it("returns 404 when the schedule is not public (maybeSingle returns null)", async () => {
    fromResponses = [{ data: null, error: null }]; // allschedules.maybeSingle() → null
    const res = await get(VALID_UUID);
    expect(res.status).toBe(404);
  });

  it("returns 200 with schedule data for a valid public schedule (no classes)", async () => {
    fromResponses = [
      { data: SCHEDULE_ROW, error: null }, // allschedules.eq(is_public=true).maybeSingle()
      { data: [], error: null }, // schedule_classes.order()
    ];
    const res = await get(VALID_UUID);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schedule.id).toBe(VALID_UUID);
    expect(body.schedule.name).toBe("My Public Schedule");
    expect(body.schedule.isPublic).toBe(true);
    expect(body.schedule.classes).toEqual([]);
  });

  it("returns 200 with formatted classes for a public schedule with classes", async () => {
    const CLASS_ROW = {
      uuid: "class-uuid-1",
      classid: 101,
      days: "MWF",
      starttime: "9:00 AM",
      endtime: "10:00 AM",
      component: "LEC",
      instructor: "Smith, J.",
      location: "Eaton",
      room: "101",
      availseats: 10,
      minhours: 3,
      maxhours: 3,
      searchclass: { dept: "EECS", code: "101", title: "Intro to CS" },
    };

    fromResponses = [
      { data: SCHEDULE_ROW, error: null },
      { data: [{ class_uuid: "class-uuid-1" }], error: null },
      { data: [CLASS_ROW], error: null },
    ];
    const res = await get(VALID_UUID);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schedule.classes).toHaveLength(1);
    expect(body.schedule.classes[0].dept).toBe("EECS");
    expect(body.schedule.classes[0].code).toBe("101");
  });

  it("returns 500 on a database error fetching schedule", async () => {
    fromResponses = [{ data: null, error: { message: "DB error" } }];
    const res = await get(VALID_UUID);
    expect(res.status).toBe(500);
  });
});
