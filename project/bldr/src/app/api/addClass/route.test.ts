/**
 * Tests for /api/addClass
 *
 * Verifies conflict detection, seat checks, and the allowConflict bypass.
 * Supabase is mocked so no real database calls are made.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Chainable mock factory ───────────────────────────────────────────────────

type MockResult = { data: unknown; error: unknown };

function makeChain(result: MockResult) {
  const p = Promise.resolve(result);
  // biome-ignore lint/suspicious/noExplicitAny: intentional chainable mock — starts from a real Promise so .then is inherited, not added to a plain object
  const chain: any = Object.assign(p, {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    eq: () => chain,
    in: () => chain,
    limit: () => chain,
    order: () => chain,
    match: () => chain,
    ilike: () => chain,
    or: () => chain,
    single: () => p,
    maybeSingle: () => p,
  });
  return chain;
}

// ─── Module-level supabase mock (vi.hoisted avoids TDZ with hoisted vi.mock) ──

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock("../../lib/supabaseClient", () => ({ supabase: mockSupabase }));

// ─── Import route AFTER mocks are set up ──────────────────────────────────────

import { POST } from "./route";

// ─── Test state ───────────────────────────────────────────────────────────────

let fromResponses: MockResult[] = [];
let fromCallIndex = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/addClass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const TARGET_CLASS = {
  uuid: "class-uuid-1",
  classid: 101,
  starttime: "9:00",
  endtime: "10:00",
  days: "MWF",
  availseats: 5,
  minhours: 3,
  maxhours: 3,
  component: "LEC",
  location: "Eaton",
  room: "101",
  instructor: "Smith",
  searchclass: { dept: "EECS", code: "101", title: "Intro to CS" },
};

const CONFLICTING_CLASS = {
  uuid: "class-uuid-2",
  classid: 202,
  starttime: "9:00",
  endtime: "10:00",
  days: "MWF",
  searchclass: { dept: "MATH", code: "220", title: "Calculus I" },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  fromCallIndex = 0;
  fromResponses = [];
  vi.clearAllMocks();
  mockSupabase.from.mockImplementation((_table: string) =>
    makeChain(fromResponses[fromCallIndex++] ?? { data: null, error: null }),
  );
});

describe("POST /api/addClass", () => {
  it("returns 400 when scheduleid is missing", async () => {
    const res = await post({ classUuid: "some-uuid" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/scheduleid/i);
  });

  it("returns 400 when neither classId nor classUuid is provided", async () => {
    const res = await post({ scheduleid: "sched-1" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the target class is not found", async () => {
    fromResponses = [
      { data: null, error: null }, // allclasses.maybeSingle() → not found
    ];
    const res = await post({ scheduleid: "sched-1", classUuid: "ghost-uuid" });
    expect(res.status).toBe(404);
  });

  it("returns 409 when class is already in the schedule", async () => {
    fromResponses = [
      { data: TARGET_CLASS, error: null }, // fetch target
      {
        data: [{ scheduleid: "sched-1", class_uuid: TARGET_CLASS.uuid }],
        error: null,
      }, // exists check
    ];
    const res = await post({
      scheduleid: "sched-1",
      classUuid: TARGET_CLASS.uuid,
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already in schedule/i);
  });

  it("returns 409 when there are no available seats", async () => {
    const noSeats = { ...TARGET_CLASS, availseats: 0 };
    fromResponses = [
      { data: noSeats, error: null }, // fetch target
      { data: [], error: null }, // exists check (not in schedule)
    ];
    const res = await post({
      scheduleid: "sched-1",
      classUuid: TARGET_CLASS.uuid,
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/no available seats/i);
  });

  it("returns 409 when a time conflict is detected (no allowConflict)", async () => {
    fromResponses = [
      { data: TARGET_CLASS, error: null }, // fetch target
      { data: [], error: null }, // exists check (not in schedule)
      { data: [{ class_uuid: "class-uuid-2" }], error: null }, // existing schedule rows
      { data: [CONFLICTING_CLASS], error: null }, // existing class details
    ];
    const res = await post({
      scheduleid: "sched-1",
      classUuid: TARGET_CLASS.uuid,
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/time conflict/i);
    expect(Array.isArray(body.conflicts)).toBe(true);
    expect(body.conflicts.length).toBeGreaterThan(0);
  });

  it("returns 200 and adds the class when no conflicts", async () => {
    fromResponses = [
      { data: TARGET_CLASS, error: null }, // fetch target
      { data: [], error: null }, // exists check
      { data: [], error: null }, // existing schedule rows (empty)
      { data: null, error: null }, // upsert success
    ];
    const res = await post({
      scheduleid: "sched-1",
      classUuid: TARGET_CLASS.uuid,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.added.dept).toBe("EECS");
    expect(body.added.code).toBe("101");
  });

  it("returns 200 with conflict warning when allowConflict=true", async () => {
    fromResponses = [
      { data: TARGET_CLASS, error: null },
      { data: [], error: null },
      { data: [{ class_uuid: "class-uuid-2" }], error: null },
      { data: [CONFLICTING_CLASS], error: null },
      { data: null, error: null }, // upsert
    ];
    const res = await post({
      scheduleid: "sched-1",
      classUuid: TARGET_CLASS.uuid,
      allowConflict: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.warnings?.timeConflicts).toBeDefined();
    expect(body.warnings.timeConflicts.length).toBeGreaterThan(0);
  });

  it("returns 500 on a database error when fetching the target", async () => {
    fromResponses = [
      { data: null, error: { message: "DB failure" } }, // fetch target error
    ];
    const res = await post({
      scheduleid: "sched-1",
      classUuid: TARGET_CLASS.uuid,
    });
    expect(res.status).toBe(500);
  });
});
