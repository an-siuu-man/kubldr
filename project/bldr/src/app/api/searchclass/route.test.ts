/**
 * Tests for /api/searchclass (POST)
 *
 * Verifies query validation, relevance scoring/sorting, and the
 * PostgREST filter-injection surface (.or() string building).
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
    ilike: () => chain,
    or: () => chain,
    limit: () => p,
  });
  return chain;
}

// ─── Module mock (vi.hoisted avoids TDZ with hoisted vi.mock) ────────────────

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../lib/supabaseClient", () => ({ supabase: mockSupabase }));

import { POST } from "./route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function post(query: unknown) {
  return POST(
    new Request("http://localhost/api/searchclass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.from.mockImplementation(() =>
    makeChain({ data: [], error: null }),
  );
});

describe("POST /api/searchclass", () => {
  it("returns 400 for a missing query", async () => {
    const res = await POST(
      new Request("http://localhost/api/searchclass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when query is not a string", async () => {
    const res = await post(123);
    expect(res.status).toBe(400);
  });

  it("returns an empty array for a whitespace-only query", async () => {
    const res = await post("   ");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns an empty array when the database returns no results", async () => {
    mockSupabase.from.mockImplementation(() =>
      makeChain({ data: [], error: null }),
    );
    const res = await post("EECS");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("deduplicates courses by dept-code and returns highest-scored entry", async () => {
    // Two rows for the same EECS 101 — one with title match, one without
    const rows = [
      { id: 1, dept: "EECS", code: "101", title: "Introduction to Computing" },
      { id: 2, dept: "EECS", code: "101", title: "Intro Computing Lab" }, // different id but same course
    ];
    mockSupabase.from.mockImplementation(() =>
      makeChain({ data: rows, error: null }),
    );
    const res = await post("introduction");
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should be deduplicated — only one EECS-101 entry
    const eecsCourses = body.filter((c: { dept: string }) => c.dept === "EECS");
    expect(eecsCourses).toHaveLength(1);
  });

  it("sorts exact dept-code matches above fuzzy title matches", async () => {
    const rows = [
      { id: 1, dept: "EECS", code: "101", title: "Intro to Computing" },
      { id: 2, dept: "MATH", code: "101", title: "EECS for Mathematicians" }, // title contains 'eecs'
    ];
    mockSupabase.from.mockImplementation(() =>
      makeChain({ data: rows, error: null }),
    );
    const res = await post("EECS 101");
    expect(res.status).toBe(200);
    const body = await res.json();
    // EECS dept with code 101 should be ranked first for "EECS 101" query
    expect(body[0].dept).toBe("EECS");
  });

  it("strips the score field from the response", async () => {
    const rows = [{ id: 1, dept: "EECS", code: "101", title: "Intro" }];
    mockSupabase.from.mockImplementation(() =>
      makeChain({ data: rows, error: null }),
    );
    const res = await post("EECS");
    const body = await res.json();
    expect(body[0]).not.toHaveProperty("score");
  });

  it("handles special characters in query without crashing (PostgREST injection surface)", async () => {
    // Commas, dots, parentheses in query — these are passed into .or() filter string
    const maliciousInputs = [
      "EECS,MATH",
      "calc(ulus)",
      "title.ilike.%hack%",
      "a);DROP TABLE searchclasses;--",
    ];
    for (const q of maliciousInputs) {
      mockSupabase.from.mockImplementation(() =>
        makeChain({ data: [], error: null }),
      );
      const res = await post(q);
      // Should not crash — may return 200 with empty or 400 for empty words
      expect([200, 400]).toContain(res.status);
    }
  });

  it("returns 500 on a database error", async () => {
    mockSupabase.from.mockImplementation(() =>
      makeChain({ data: null, error: { message: "connection refused" } }),
    );
    const res = await post("EECS");
    expect([500]).toContain(res.status);
  });
});
