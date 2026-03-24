"use client";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toastStyle from "@/components/ui/toastStyle";
import { createClient } from "@/lib/supabase/client";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleClick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast("Passwords do not match", {
        style: toastStyle,
        description: "Please ensure both password fields match.",
        duration: 3000,
        icon: <XCircle className="h-5 w-5 text-yellow-500" />,
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long", {
        style: toastStyle,
        duration: 3000,
        icon: <Lock className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast.error("Signup Failed", {
          style: toastStyle,
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        });
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error("User already exists", {
            style: toastStyle,
            duration: 3000,
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          });
          return;
        }

        toast.success("Account Created", {
          style: toastStyle,
          description: data.session
            ? "Redirecting to builder..."
            : "Please check your email to confirm your account.",
          duration: 3000,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });

        // If session exists (email confirmation disabled), redirect to builder
        if (data.session) {
          router.push("/builder");
          router.refresh();
        } else {
          // Otherwise redirect to login page
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error", {
        style: toastStyle,
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.12),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.1),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-[28rem] flex-col items-center"
        >
          {/* Brand */}
          <Link href="/" className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
              <span className="font-dmsans text-2xl font-bold tracking-tight">
                <span className="text-white">b</span>
                <span className="text-red-500">l</span>
                <span className="text-blue-500">d</span>
                <span className="text-yellow-300">r</span>
              </span>
            </div>
            <div className="text-center">
              <p className="font-figtree text-xl font-semibold tracking-tight">
                Flagship Schedule Builder
              </p>
              <p className="font-inter text-sm text-[#A8A8A8]">
                University of Kansas schedule planning
              </p>
            </div>
          </Link>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full"
          >
            <div className="w-full rounded-[28px] border border-white/10 bg-[#111111]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
              <div className="mb-2 flex flex-col items-start">
                <h2 className="font-dmsans text-3xl font-bold text-white">
                  Sign up
                </h2>
                <p className="mt-2 font-inter text-sm text-[#A8A8A8]">
                  Enter your email and password to start building schedules.
                </p>
              </div>

              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleClick}
              >
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 }}
                >
                  <Label
                    htmlFor="email"
                    className="mb-2 block text-sm font-inter"
                  >
                    Email
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="your.email@example.com"
                    className="border-2 border-[#404040] font-inter selection:bg-blue-400"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.26 }}
                >
                  <Label
                    htmlFor="password"
                    className="mb-2 block text-sm font-inter"
                  >
                    Password
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    placeholder="At least 6 characters"
                    className="border-2 border-[#404040] font-inter selection:bg-blue-400"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.34 }}
                >
                  <Label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-inter"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    id="confirm-password"
                    placeholder="Re-enter password"
                    className="border-2 border-[#404040] font-inter selection:bg-blue-400"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.42 }}
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    className="my-3 w-full bg-white text-[#101010] hover:bg-[#e8e8e8] font-dmsans text-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="mt-5 font-inter text-xs text-[#a8a8a8]"
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-white underline underline-offset-2 font-inter"
                >
                  Log in
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Back home link */}
          <Link
            href="/"
            className="mt-5 font-inter text-xs text-[#606060] hover:bg-white/10 rounded-sm px-1 transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
