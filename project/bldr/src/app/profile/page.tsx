"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Link2Off,
  Loader2,
  LogOut,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { formatScheduleTerm } from "@/lib/scheduleFormat";

type ScheduleSummary = {
  id: string;
  name: string;
  semester: string;
  year: number;
  isPublic: boolean;
};

/**
 * Profile page — account identity summary, session actions, share settings,
 * and multi-select schedule deletion. Sequence 1+2 of 3 profile features.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, session, loading, signOut } = useAuth();
  const appToast = useAppToast();

  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Client-side guard — middleware already redirects unauthenticated requests,
  // but this prevents a content flash on client transitions.
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch user's schedules once the session is available.
  useEffect(() => {
    if (!session?.access_token) return;

    setSchedulesLoading(true);
    fetch("/api/getUserSchedules", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSchedules(
          (data.schedules ?? []).map(
            (s: {
              id: string;
              name: string;
              semester: string;
              year: number;
              isPublic: boolean;
            }) => ({
              id: s.id,
              name: s.name,
              semester: s.semester,
              year: s.year,
              isPublic: Boolean(s.isPublic),
            }),
          ),
        );
      })
      .catch(() => {
        appToast.error("Failed to load schedules", {
          action: "scheduleShare",
          duration: 3000,
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        });
      })
      .finally(() => setSchedulesLoading(false));
  }, [session?.access_token, appToast]);

  const getShareUrl = (scheduleId: string) =>
    `${window.location.origin}/s/${scheduleId}`;

  const handleCopyLink = async (schedule: ScheduleSummary) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(schedule.id));
      appToast.success("Share link copied", {
        action: "scheduleShare",
        duration: 2000,
        icon: <Copy className="h-5 w-5 text-success" />,
      });
    } catch {
      appToast.error("Failed to copy link", {
        action: "scheduleShare",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
    }
  };

  const handleRevoke = async (schedule: ScheduleSummary) => {
    if (!session?.access_token) return;
    setRevokingId(schedule.id);
    try {
      const res = await fetch("/api/shareSchedule", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scheduleId: schedule.id, isPublic: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke link");

      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? { ...s, isPublic: false } : s)),
      );
      appToast.success("Public link revoked", {
        action: "scheduleShare",
        duration: 2000,
        icon: <Link2Off className="h-5 w-5 text-success" />,
      });
    } catch (err) {
      appToast.error(
        err instanceof Error ? err.message : "Failed to revoke link",
        {
          action: "scheduleShare",
          duration: 3000,
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
        },
      );
    } finally {
      setRevokingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === schedules.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(schedules.map((s) => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!session?.access_token || selected.size === 0) return;
    setDeleting(true);
    const ids = [...selected];
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch("/api/deleteSchedule", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ scheduleId: id }),
          }).then((r) => r.json().then((d) => ({ ok: r.ok, data: d, id }))),
        ),
      );

      const deleted: string[] = [];
      const failed: string[] = [];
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.ok) {
          deleted.push(r.value.id);
        } else {
          const id =
            r.status === "fulfilled" ? r.value.id : ids[results.indexOf(r)];
          failed.push(id);
        }
      }

      if (deleted.length > 0) {
        setSchedules((prev) => prev.filter((s) => !deleted.includes(s.id)));
        setSelected((prev) => {
          const next = new Set(prev);
          for (const id of deleted) next.delete(id);
          return next;
        });
        appToast.success(
          `Deleted ${deleted.length} schedule${deleted.length > 1 ? "s" : ""}`,
          {
            action: "scheduleDelete",
            duration: 2000,
            icon: <CheckCircle2 className="h-5 w-5 text-success" />,
          },
        );
      }
      if (failed.length > 0) {
        appToast.error(
          `Failed to delete ${failed.length} schedule${failed.length > 1 ? "s" : ""}`,
          {
            action: "scheduleDelete",
            duration: 3000,
            icon: <AlertCircle className="h-5 w-5 text-destructive" />,
          },
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      appToast.success("Signed out successfully", {
        action: "auth",
        duration: 2000,
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
      });
      router.push("/login");
      router.refresh();
    } catch {
      appToast.error("Failed to sign out", {
        action: "auth",
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <p className="font-inter text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isGuest = user.is_anonymous === true;
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const allSelected =
    schedules.length > 0 && selected.size === schedules.length;
  const someSelected = selected.size > 0;

  return (
    <div className="flex min-h-screen flex-col items-center bg-desk px-4 py-10">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-6 w-full max-w-md"
      >
        <h1 className="display text-[clamp(2.25rem,6vw,3rem)]">Your account</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Your session, saved schedules and share links.
        </p>
      </motion.div>

      {/* ── Unified profile card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md overflow-hidden border-2 border-crimson bg-card"
      >
        {/* ── Identity section ── */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-rule-strong bg-secondary">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-dmsans text-base font-semibold text-foreground">
                {isGuest ? "Guest session" : user.email}
              </p>
              {isGuest ? (
                <Badge className="form-label mt-1 rounded-none border-2 border-crimson bg-transparent px-1.5 py-0 text-[10.5px] text-crimson hover:bg-transparent">
                  Guest
                </Badge>
              ) : (
                <Badge className="form-label mt-1 rounded-none border-2 border-ballpoint bg-transparent px-1.5 py-0 text-[10.5px] text-ballpoint hover:bg-transparent">
                  Permanent User
                </Badge>
              )}
            </div>
          </div>

          {joinedDate && (
            <div className="mt-5 flex items-center justify-between">
              <span className="font-inter text-sm text-muted-foreground">
                Joined
              </span>
              <span className="font-inter text-sm text-foreground">
                {joinedDate}
              </span>
            </div>
          )}
        </div>

        {/* ── Guest upgrade prompt ── */}
        {isGuest && (
          <>
            <Separator className="bg-rule-strong" />
            <div className="p-6">
              <div className="border-2 border-crimson bg-canary p-4">
                <div className="flex items-start gap-3">
                  <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold text-foreground">
                      Save your schedules permanently
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-foreground">
                      Create a free account to keep your schedules across
                      sessions and unlock sharing.
                    </p>
                    <Link href="/upgrade" className="mt-3 inline-block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer rounded-none border-2 border-crimson bg-card text-xs font-bold text-crimson hover:bg-accent hover:text-crimson"
                      >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Schedules section ── */}
        <Separator className="bg-rule-strong" />
        <div className="p-6">
          {/* Section header */}
          <div className="mb-3 flex items-center justify-between">
            <p className="form-label">Schedules</p>
            {someSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 cursor-pointer gap-1.5 px-2 font-dmsans text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteSelected}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Delete {selected.size}
              </Button>
            )}
          </div>

          {schedulesLoading ? (
            <div className="flex items-center justify-center py-5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <p className="py-3 text-center font-inter text-sm text-muted-foreground">
              No schedules yet.{" "}
              <Link
                href="/builder"
                className="text-foreground underline-offset-2 hover:underline"
              >
                Build one
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <>
              {/* Select-all row */}
              <div className="mb-2 flex items-center gap-2 px-0.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--crimson)]"
                  aria-label="Select all schedules"
                />
                <span className="font-inter text-xs text-muted-foreground">
                  {allSelected ? "Deselect all" : "Select all"}
                </span>
              </div>

              {/* Scrollable schedule list */}
              <div className="scrollbar-hidden flex max-h-56 flex-col gap-1 overflow-y-auto">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`flex items-center gap-2 border px-3 py-2 transition-colors ${
                      selected.has(schedule.id)
                        ? "border-ballpoint bg-accent"
                        : "border-border bg-card hover:border-border hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(schedule.id)}
                      onChange={() => toggleSelect(schedule.id)}
                      className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[var(--crimson)]"
                      aria-label={`Select ${schedule.name}`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-dmsans text-sm font-medium leading-tight text-foreground">
                        {schedule.name}
                      </p>
                      <p className="font-inter text-xs text-muted-foreground">
                        {formatScheduleTerm(schedule.semester, schedule.year)}
                        {schedule.isPublic && (
                          <span className="ml-1.5 text-success">· Public</span>
                        )}
                      </p>
                    </div>

                    {schedule.isPublic && (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 cursor-pointer p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => handleCopyLink(schedule)}
                          title="Copy share link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 cursor-pointer p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRevoke(schedule)}
                          disabled={revokingId === schedule.id}
                          title="Revoke public link"
                        >
                          {revokingId === schedule.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Link2Off className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Sign out ── */}
        <Separator className="bg-rule-strong" />
        <div className="p-6">
          <Button
            variant="outline"
            className="w-full cursor-pointer rounded-none border-2 border-crimson text-sm font-bold text-crimson hover:bg-accent hover:text-crimson"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </motion.div>

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-5"
      >
        <Link
          href="/builder"
          className="inline-flex items-center gap-1 px-1 text-[14px] font-bold text-crimson hover:bg-accent"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to builder
        </Link>
      </motion.div>
    </div>
  );
}
