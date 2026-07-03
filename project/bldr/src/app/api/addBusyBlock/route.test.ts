/**
 * Tests for /api/addBusyBlock
 *
 * Verifies field validation (day, time format, 15-minute increments,
 * start/end ordering) and the successful insert path.
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
    delete: () => chain,
    eq: () => chain,
    single: () => p,
    maybeSingle: () => p,
  });
  return chain;
}

// ─── Module-level supabase mock (vi.hoisted avoids TDZ with hoisted vi.mock) ──

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
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
    new Request("http://localhost/api/addBusyBlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const VALID_BODY = {
  scheduleid: "schedule-uuid-1",
  day: "M",
  starttime: "09:00",
  endtime: "10:15",
};

const INSERTED_ROW = {
  uuid: "busy-uuid-1",
  scheduleid: "schedule-uuid-1",
  day: "M",
  starttime: "09:00",
  endtime: "10:15",
  label: "Busy",
  created_at: null,
};

beforeEach(() => {
  fromCallIndex = 0;
  fromResponses = [];
  vi.clearAllMocks();
  mockSupabase.from.mockImplementation((_table: string) =>
    makeChain(fromResponses[fromCallIndex++] ?? { data: null, error: null }),
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/addBusyBlock", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await post({ scheduleid: "schedule-uuid-1", day: "M" });
    expect(res.status).toBe(400);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid day abbreviation", async () => {
    const res = await post({ ...VALID_BODY, day: "Sa" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/day/i);
  });

  it("returns 400 for a malformed time string", async () => {
    const res = await post({ ...VALID_BODY, starttime: "9am" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/format/i);
  });

  it("returns 400 when times are not on 15-minute increments", async () => {
    const res = await post({ ...VALID_BODY, starttime: "09:10" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/15-minute/i);
  });

  it("returns 400 when endtime is not after starttime", async () => {
    const res = await post({
      ...VALID_BODY,
      starttime: "10:00",
      endtime: "10:00",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/after/i);
  });

  it("inserts and returns the busy block on valid input", async () => {
    fromResponses = [{ data: INSERTED_ROW, error: null }];
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.added.uuid).toBe("busy-uuid-1");
    expect(body.added.label).toBe("Busy");
    expect(mockSupabase.from).toHaveBeenCalledWith("schedule_busyblocks");
  });

  it("returns 500 on a database insert error", async () => {
    fromResponses = [{ data: null, error: { message: "DB error" } }];
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
  });
});
