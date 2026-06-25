/**
 * Tests for /api/shareSchedule (PATCH)
 *
 * Verifies auth enforcement, UUID validation, ownership check, and success path.
 * Supabase is mocked so no real database calls are made.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock factory ─────────────────────────────────────────────────────────────

type MockResult = { data: unknown; error: unknown };

function makeChain(result: MockResult) {
  const p = Promise.resolve(result);
  // biome-ignore lint/suspicious/noExplicitAny: intentional chainable mock — starts from a real Promise so .then is inherited, not added to a plain object
  const chain: any = Object.assign(p, {
    select: () => chain,
    update: () => chain,
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
import { PATCH } from "./route";

// ─── Test state ───────────────────────────────────────────────────────────────

let fromResponses: MockResult[] = [];
let fromCallIndex = 0;

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

function patch(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return PATCH(
    new NextRequest("http://localhost/api/shareSchedule", {
      method: "PATCH",
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

describe("PATCH /api/shareSchedule", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await patch({ scheduleId: VALID_UUID, isPublic: true });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/authorization/i);
  });

  it("returns 401 when the token is invalid", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });
    const res = await patch(
      { scheduleId: VALID_UUID, isPublic: true },
      "bad-token",
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-UUID scheduleId", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await patch(
      { scheduleId: "not-a-uuid", isPublic: true },
      "valid-token",
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  it("returns 400 when isPublic is not a boolean", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await patch(
      { scheduleId: VALID_UUID, isPublic: "yes" },
      "valid-token",
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the user does not own the schedule", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fromResponses = [{ data: null, error: { message: "no rows" } }]; // ownership check fails
    const res = await patch(
      { scheduleId: VALID_UUID, isPublic: true },
      "valid-token",
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it("returns 200 and toggles isPublic when authenticated and owns schedule", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fromResponses = [
      { data: { scheduleid: VALID_UUID }, error: null }, // ownership check passes
      { data: null, error: null }, // update succeeds
    ];
    const res = await patch(
      { scheduleId: VALID_UUID, isPublic: true },
      "valid-token",
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPublic).toBe(true);
  });

  it("returns 500 on a database update error", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    fromResponses = [
      { data: { scheduleid: VALID_UUID }, error: null }, // ownership check passes
      { data: null, error: { message: "update failed" } }, // update fails
    ];
    const res = await patch(
      { scheduleId: VALID_UUID, isPublic: false },
      "valid-token",
    );
    expect(res.status).toBe(500);
  });
});
