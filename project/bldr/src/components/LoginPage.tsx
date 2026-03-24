"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  UserCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import toastStyle from "@/components/ui/toastStyle";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Login Failed", {
          style: toastStyle,
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        });
        return;
      }

      if (data.user) {
        toast.success("Login Successful", {
          style: toastStyle,
          description: "Redirecting to builder...",
          duration: 2000,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
        router.push("/builder");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
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

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);

    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        toast.error("Guest Login Failed", {
          style: toastStyle,
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        });
        return;
      }

      if (data.user) {
        toast.success("Welcome, Guest!", {
          style: toastStyle,
          description: "Redirecting to builder...",
          duration: 2000,
          icon: <UserCircle className="h-5 w-5 text-green-500" />,
        });
        router.push("/builder");
        router.refresh();
      }
    } catch (error) {
      console.error("Guest login error:", error);
      toast.error("Error", {
        style: toastStyle,
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsGuestLoading(false);
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
                  Log in
                </h2>
                <p className="mt-2 font-inter text-sm text-[#A8A8A8]">
                  Enter your email and password to continue to the builder.
                </p>
              </div>

              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleSubmit}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="email"
                    placeholder="your.email@example.com"
                    className="border-2 border-[#404040] font-inter selection:bg-blue-400"
                    required
                    disabled={isLoading || isGuestLoading}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="password"
                    placeholder="********"
                    className="border-2 border-[#404040] font-inter selection:bg-blue-400"
                    required
                    disabled={isLoading || isGuestLoading}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.34 }}
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    className="my-3 w-full bg-white text-[#101010] hover:bg-[#e8e8e8] font-dmsans text-md"
                    disabled={isLoading || isGuestLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  <div className="relative my-3 flex w-full items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#404040]" />
                    </div>
                    <span className="relative bg-[#111111] px-3 font-inter text-xs text-[#a8a8a8]">
                      or
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full bg-[#1e1e1e] border border-[#404040] font-dmsans text-md text-white hover:bg-[#2a2a2a]"
                    disabled={isLoading || isGuestLoading}
                    onClick={handleGuestLogin}
                  >
                    {isGuestLoading ? (
                      <>
                        <Spinner />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <UserCircle className="mr-2 h-4 w-4" />
                        Continue as Guest
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.42 }}
                className="mt-5 font-inter text-xs text-[#a8a8a8]"
              >
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-medium text-white underline underline-offset-2">
                  Sign up
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
