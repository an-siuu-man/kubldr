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
  Sparkles,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getToastStyle } from "@/components/ui/toastStyle";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useAuth } from "@/contexts/AuthContext";

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
  const { theme } = useAppSettings();
  const appToastStyle = getToastStyle(theme);

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
        toast.error("Failed to load schedules", {
          style: { ...appToastStyle },
          duration: 3000,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        });
      })
      .finally(() => setSchedulesLoading(false));
  }, [session?.access_token, appToastStyle]);

  const getShareUrl = (scheduleId: string) =>
    `${window.location.origin}/s/${scheduleId}`;

  const handleCopyLink = async (schedule: ScheduleSummary) => {
    try {
      await navigator.clipboard.writeText(getShareUrl(schedule.id));
      toast.success("Share link copied", {
        style: { ...appToastStyle },
        duration: 2000,
        icon: <Copy className="h-5 w-5 text-green-500" />,
      });
    } catch {
      toast.error("Failed to copy link", {
        style: { ...appToastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
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
      toast.success("Public link revoked", {
        style: { ...appToastStyle },
        duration: 2000,
        icon: <Link2Off className="h-5 w-5 text-green-500" />,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke link",
        {
          style: { ...appToastStyle },
          duration: 3000,
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
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
        toast.success(
          `Deleted ${deleted.length} schedule${deleted.length > 1 ? "s" : ""}`,
          {
            style: { ...appToastStyle },
            duration: 2000,
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          },
        );
      }
      if (failed.length > 0) {
        toast.error(
          `Failed to delete ${failed.length} schedule${failed.length > 1 ? "s" : ""}`,
          {
            style: { ...appToastStyle },
            duration: 3000,
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
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
      toast.success("Signed out successfully", {
        style: { ...appToastStyle },
        duration: 2000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out", {
        style: { ...appToastStyle },
        duration: 3000,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <p className="font-inter text-sm text-slate-600 dark:text-[#A8A8A8]">
            Loading...
          </p>
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
    <div className="flex min-h-screen flex-col items-center bg-slate-100 px-4 py-10 dark:bg-[#080808]">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-8 w-full max-w-md text-center"
      >
        <h1 className="font-figtree text-4xl font-semibold text-slate-950 dark:text-white">
          Your Account
        </h1>
        <p className="mt-1 font-dmsans text-sm text-slate-600 dark:text-[#A8A8A8]">
          Manage your{" "}
          <span className="font-bold">
            <span className="text-slate-950 dark:text-white">b</span>
            <span className="text-red-500">l</span>
            <span className="text-blue-500">d</span>
            <span className="text-yellow-300">r</span>
          </span>{" "}
          session
        </p>
      </motion.div>

      {/* ── Unified profile card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#404040] dark:bg-[#111111] dark:shadow-none"
      >
        {/* ── Identity section ── */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
              <User className="h-5 w-5 text-slate-500 dark:text-white/60" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-dmsans text-base font-semibold text-slate-950 dark:text-white">
                {isGuest ? "Guest session" : user.email}
              </p>
              {isGuest ? (
                <Badge className="mt-1 border border-yellow-600/50 bg-yellow-900/20 font-dmsans text-xs text-yellow-400 hover:bg-yellow-900/20">
                  Guest
                </Badge>
              ) : (
                <Badge className="mt-1 border border-emerald-600/50 bg-emerald-900/20 font-dmsans text-xs text-emerald-400 hover:bg-emerald-900/20">
                  Permanent User
                </Badge>
              )}
            </div>
          </div>

          {joinedDate && (
            <div className="mt-5 flex items-center justify-between">
              <span className="font-inter text-sm text-slate-600 dark:text-[#A8A8A8]">
                Joined
              </span>
              <span className="font-inter text-sm text-slate-950 dark:text-white">
                {joinedDate}
              </span>
            </div>
          )}
        </div>

        {/* ── Guest upgrade prompt ── */}
        {isGuest && (
          <>
            <Separator className="bg-slate-200 dark:bg-white/8" />
            <div className="p-6">
              <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                  <div className="min-w-0">
                    <p className="font-dmsans text-sm font-semibold text-yellow-300">
                      Save your schedules permanently
                    </p>
                    <p className="mt-1 font-inter text-xs leading-5 text-slate-600 dark:text-[#A8A8A8]">
                      Create a free account to keep your schedules across
                      sessions and unlock sharing.
                    </p>
                    <Link href="/upgrade" className="mt-3 inline-block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer border-yellow-600/50 font-dmsans text-xs text-yellow-400 hover:bg-yellow-900/30"
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
        <Separator className="bg-slate-200 dark:bg-white/8" />
        <div className="p-6">
          {/* Section header */}
          <div className="mb-3 flex items-center justify-between">
            <p className="font-dmsans text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
              Schedules
            </p>
            {someSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 cursor-pointer gap-1.5 px-2 font-dmsans text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
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
              <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-white/30" />
            </div>
          ) : schedules.length === 0 ? (
            <p className="py-3 text-center font-inter text-sm text-slate-600 dark:text-[#A8A8A8]">
              No schedules yet.{" "}
              <Link
                href="/builder"
                className="text-slate-950 underline-offset-2 hover:underline dark:text-white"
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
                  className="h-3.5 w-3.5 cursor-pointer accent-slate-900 dark:accent-white"
                  aria-label="Select all schedules"
                />
                <span className="font-inter text-xs text-slate-500 dark:text-white/35">
                  {allSelected ? "Deselect all" : "Select all"}
                </span>
              </div>

              {/* Scrollable schedule list */}
              <div className="scrollbar-hidden flex max-h-56 flex-col gap-1 overflow-y-auto">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      selected.has(schedule.id)
                        ? "border-slate-300 bg-slate-100 dark:border-white/15 dark:bg-white/6"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-white/6 dark:bg-white/2 dark:hover:border-white/10 dark:hover:bg-white/4"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(schedule.id)}
                      onChange={() => toggleSelect(schedule.id)}
                      className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-slate-900 dark:accent-white"
                      aria-label={`Select ${schedule.name}`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-dmsans text-sm font-medium leading-tight text-slate-950 dark:text-white">
                        {schedule.name}
                      </p>
                      <p className="font-inter text-xs text-slate-600 dark:text-[#A8A8A8]">
                        {schedule.semester} {schedule.year}
                        {schedule.isPublic && (
                          <span className="ml-1.5 text-emerald-400">
                            · Public
                          </span>
                        )}
                      </p>
                    </div>

                    {schedule.isPublic && (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 cursor-pointer p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-white/40 dark:hover:bg-white/8 dark:hover:text-white"
                          onClick={() => handleCopyLink(schedule)}
                          title="Copy share link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 cursor-pointer p-0 text-red-400/50 hover:bg-red-500/10 hover:text-red-400"
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
        <Separator className="bg-slate-200 dark:bg-white/8" />
        <div className="p-6">
          <Button
            variant="outline"
            className="w-full cursor-pointer border-slate-200 font-dmsans text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
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
          className="inline-flex items-center gap-1 rounded-sm px-1 font-inter text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:text-[#A8A8A8] dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to builder
        </Link>
      </motion.div>
    </div>
  );
}
