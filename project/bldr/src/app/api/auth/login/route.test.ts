/**
 * Smoke tests for /api/auth/login (POST)
 *
 * Verifies field validation and that Supabase signInWithPassword is
 * called correctly. The server-side Supabase client is mocked.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// ─── Mock @/lib/supabase/server so next/headers is never imported ─────────────

const mockSignIn = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { signInWithPassword: mockSignIn },
    }),
  ),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 400 when email is missing", async () => {
    const res = await post({ password: "secret" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it("returns 400 when password is missing", async () => {
    const res = await post({ email: "user@test.com" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when Supabase reports invalid credentials", async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    const res = await post({ email: "bad@test.com", password: "wrong" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid login/i);
  });

  it("returns 200 with user and session on successful login", async () => {
    const fakeUser = { id: "user-1", email: "user@test.com" };
    const fakeSession = { access_token: "tok_abc", expires_at: 9999 };
    mockSignIn.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });
    const res = await post({ email: "user@test.com", password: "correct" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/successful/i);
    expect(body.user.id).toBe("user-1");
    expect(body.session.access_token).toBe("tok_abc");
  });
});
