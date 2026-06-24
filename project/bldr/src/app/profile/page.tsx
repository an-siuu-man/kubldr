"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import toastStyle from "@/components/ui/toastStyle";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Profile page — account identity summary and session actions.
 *
 * Shows the signed-in user's email, account status (guest vs. full account),
 * and join date. Guest users see an upgrade prompt. All users can sign out.
 * This is sequence 1 of 3 profile-related pages; later siblings extend this
 * route with share settings and account management.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Client-side guard — middleware already redirects unauthenticated requests,
  // but this prevents a content flash on client transitions.
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully", {
        style: { ...toastStyle },
        duration: 2000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out", {
        style: { ...toastStyle },
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
          <p className="font-inter text-sm text-[#A8A8A8]">Loading...</p>
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-8 text-center"
      >
        <h1 className="font-figtree text-4xl font-semibold text-white">
          Your Account
        </h1>
        <p className="mt-1 font-dmsans text-sm text-[#A8A8A8]">
          Manage your{" "}
          <span className="font-bold">
            <span className="text-white">b</span>
            <span className="text-red-500">l</span>
            <span className="text-blue-500">d</span>
            <span className="text-yellow-300">r</span>
          </span>{" "}
          session
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md rounded-xl border border-[#404040] bg-[#111111] p-8"
      >
        {/* Identity row */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <User className="h-5 w-5 text-white/60" />
          </div>
          <div className="min-w-0">
            <p className="font-dmsans text-base font-semibold text-white truncate">
              {isGuest ? "Guest session" : user.email}
            </p>
            {isGuest ? (
              <Badge className="mt-1 border border-yellow-600/50 bg-yellow-900/20 font-dmsans text-xs text-yellow-400 hover:bg-yellow-900/20">
                Guest
              </Badge>
            ) : (
              <Badge className="mt-1 border border-emerald-600/50 bg-emerald-900/20 font-dmsans text-xs text-emerald-400 hover:bg-emerald-900/20">
                Full account
              </Badge>
            )}
          </div>
        </div>

        {/* Joined date */}
        {joinedDate && (
          <>
            <Separator className="my-6 bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="font-inter text-sm text-[#A8A8A8]">Joined</span>
              <span className="font-inter text-sm text-white">
                {joinedDate}
              </span>
            </div>
          </>
        )}

        {/* Guest upgrade prompt */}
        {isGuest && (
          <>
            <Separator className="my-6 bg-white/10" />
            <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                <div className="min-w-0">
                  <p className="font-dmsans text-sm font-semibold text-yellow-300">
                    Save your schedules permanently
                  </p>
                  <p className="mt-1 font-inter text-xs leading-5 text-[#A8A8A8]">
                    Create a free account to keep your schedules across sessions
                    and unlock sharing.
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
          </>
        )}

        {/* Sign out */}
        <Separator className="my-6 bg-white/10" />
        <Button
          variant="outline"
          className="w-full cursor-pointer border-white/10 font-dmsans text-sm text-white/70 hover:bg-white/5 hover:text-white"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </motion.div>

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="mt-5"
      >
        <Link
          href="/builder"
          className="inline-flex items-center gap-1 rounded-sm px-1 font-inter text-xs text-[#A8A8A8] hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to builder
        </Link>
      </motion.div>
    </div>
  );
}
