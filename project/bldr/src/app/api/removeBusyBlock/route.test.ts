/**
 * Tests for /api/removeBusyBlock
 *
 * Verifies field validation, the not-found path, and successful deletion.
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
    new Request("http://localhost/api/removeBusyBlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/removeBusyBlock", () => {
  it("returns 400 when scheduleid is missing", async () => {
    const res = await post({ uuid: "busy-uuid-1" });
    expect(res.status).toBe(400);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("returns 400 when uuid is missing", async () => {
    const res = await post({ scheduleid: "schedule-uuid-1" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when no matching busy block exists", async () => {
    fromResponses = [{ data: [], error: null }];
    const res = await post({
      scheduleid: "schedule-uuid-1",
      uuid: "busy-uuid-1",
    });
    expect(res.status).toBe(404);
  });

  it("deletes the busy block and returns success", async () => {
    fromResponses = [{ data: [{ uuid: "busy-uuid-1" }], error: null }];
    const res = await post({
      scheduleid: "schedule-uuid-1",
      uuid: "busy-uuid-1",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("schedule_busyblocks");
  });

  it("returns 500 on a database delete error", async () => {
    fromResponses = [{ data: null, error: { message: "DB error" } }];
    const res = await post({
      scheduleid: "schedule-uuid-1",
      uuid: "busy-uuid-1",
    });
    expect(res.status).toBe(500);
  });
});
