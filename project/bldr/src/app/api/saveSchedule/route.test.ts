/**
 * Tests for /api/saveSchedule (POST)
 *
 * Verifies auth enforcement, missing-field validation, ownership check on
 * updates, and the create/update paths.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock factory ─────────────────────────────────────────────────────────────

type MockResult = { data: unknown; error: unknown };

function makeChain(result: MockResult) {
  const p = Promise.resolve(result);
  // biome-ignore lint/suspicious/noExplicitAny: intentional chainable mock — starts from a real Promise so .then is inherited, not added to a plain object
  const chain: any = Object.assign(p, {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    single: () => p,
    maybeSingle: () => p,
  });
  return chain;
}

// ─── Module mock (vi.hoisted avoids TDZ with hoisted vi.mock) ────────────────

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock("../../lib/supabaseClient", () => ({ supabase: mockSupabase }));

import { NextRequest } from "next/server";
import { POST } from "./route";

// ─── Test state ───────────────────────────────────────────────────────────────

let fromResponses: MockResult[] = [];
let fromCallIndex = 0;

function post(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return POST(
    new NextRequest("http://localhost/api/saveSchedule", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  fromCallIndex = 0;
  fromResponses = [];
  vi.clearAllMocks();
  mockSupabase.from.mockImplementation((_table: string) =>
    makeChain(fromResponses[fromCallIndex++] ?? { data: null, error: null }),
  );
  mockSupabase.auth.getUser = vi.fn();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/saveSchedule", () => {
  it("returns 401 when Authorization header is absent", async () => {
    const res = await post({
      name: "My Schedule",
      semester: "Fall",
      year: 2025,
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when the token is invalid", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });
    const res = await post(
      { name: "My Schedule", semester: "Fall", year: 2025 },
      "bad",
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await post({ semester: "Fall", year: 2025 }, "token"); // missing name
    expect(res.status).toBe(400);
  });

  it("creates a new schedule when no scheduleId is provided", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fromResponses = [
      { data: { scheduleid: "new-sched-id" }, error: null }, // insert + select single
      { data: null, error: null }, // userschedule insert
    ];
    const res = await post(
      { name: "New Schedule", semester: "Spring", year: 2026 },
      "token",
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.scheduleId).toBe("new-sched-id");
  });

  it("returns 404 when updating a schedule the user does not own", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fromResponses = [
      { data: null, error: { message: "not found" } }, // ownership check fails
    ];
    const res = await post(
      {
        scheduleId: "existing-id",
        name: "Updated",
        semester: "Fall",
        year: 2025,
      },
      "token",
    );
    expect(res.status).toBe(404);
  });

  it("updates schedule metadata and replaces classes when user owns it", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const SCHED_ID = "existing-sched-id";
    fromResponses = [
      { data: { scheduleid: SCHED_ID }, error: null }, // ownership check passes
      { data: null, error: null }, // update allschedules
      { data: null, error: null }, // delete old schedule_classes
      { data: null, error: null }, // insert new classes
    ];
    const res = await post(
      {
        scheduleId: SCHED_ID,
        name: "Updated",
        semester: "Fall",
        year: 2025,
        classes: [{ uuid: "class-1" }, { uuid: "class-2" }],
      },
      "token",
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.scheduleId).toBe(SCHED_ID);
  });
});
