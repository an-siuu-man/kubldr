/**
 * Tests for /api/updateBusyBlock
 *
 * Verifies field validation, the not-found path, and successful updates.
 * Supabase is mocked so no real database calls are made.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockResult = { data: unknown; error: unknown };

function makeChain(result: MockResult) {
  const p = Promise.resolve(result);
  // biome-ignore lint/suspicious/noExplicitAny: intentional chainable mock starts from a real Promise so .then is inherited, not added to a plain object
  const chain: any = Object.assign(p, {
    update: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => p),
  });
  return chain;
}

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../lib/supabaseClient", () => ({ supabase: mockSupabase }));

import { POST } from "./route";

let fromResponses: MockResult[] = [];
let fromCallIndex = 0;

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/updateBusyBlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const VALID_BODY = {
  scheduleid: "schedule-uuid-1",
  uuid: "busy-uuid-1",
  starttime: "09:15",
  endtime: "10:30",
};

const UPDATED_ROW = {
  uuid: "busy-uuid-1",
  scheduleid: "schedule-uuid-1",
  day: "M",
  starttime: "09:15",
  endtime: "10:30",
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

describe("POST /api/updateBusyBlock", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await post({ scheduleid: "schedule-uuid-1" });
    expect(res.status).toBe(400);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed time string", async () => {
    const res = await post({ ...VALID_BODY, starttime: "9am" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/format/i);
  });

  it("returns 400 when times are not on 15-minute increments", async () => {
    const res = await post({ ...VALID_BODY, endtime: "10:10" });
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

  it("returns 404 when no matching busy block exists", async () => {
    fromResponses = [{ data: null, error: null }];
    const res = await post(VALID_BODY);
    expect(res.status).toBe(404);
  });

  it("updates and returns the busy block on valid input", async () => {
    fromResponses = [{ data: UPDATED_ROW, error: null }];
    const res = await post(VALID_BODY);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.updated.uuid).toBe("busy-uuid-1");
    expect(body.updated.starttime).toBe("09:15");
    expect(mockSupabase.from).toHaveBeenCalledWith("schedule_busyblocks");
  });

  it("returns 500 on a database update error", async () => {
    fromResponses = [{ data: null, error: { message: "DB error" } }];
    const res = await post(VALID_BODY);
    expect(res.status).toBe(500);
  });
});
