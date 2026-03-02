"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  AlertCircle,
} from "lucide-react";
import toastStyle from "@/components/ui/toastStyle";
import { motion } from "framer-motion";

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
        style: { ...toastStyle, backgroundColor: "#404040" },
        description: "Please ensure both password fields match.",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long", {
        style: { ...toastStyle, backgroundColor: "#404040" },
        duration: 3000,
        icon: <Lock className="h-5 w-5" />,
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
          style: { ...toastStyle, backgroundColor: "#404040" },
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5" />,
        });
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error("User already exists", {
            style: { ...toastStyle, backgroundColor: "#404040" },
            duration: 3000,
            icon: <AlertCircle className="h-5 w-5" />,
          });
          return;
        }

        toast.success("Account Created", {
          style: { ...toastStyle, backgroundColor: "#404040" },
          description: data.session
            ? "Redirecting to builder..."
            : "Please check your email to confirm your account.",
          duration: 3000,
          icon: <CheckCircle2 className="h-5 w-5" />,
        });

        // If session exists (email confirmation disabled), redirect to builder
        if (data.session) {
          router.push("/builder");
          router.refresh();
        } else {
          // Otherwise redirect to login page
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Error", {
        style: { ...toastStyle, backgroundColor: "#404040" },
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup">
      <div className="flex flex-col justify-start items-center h-screen py-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="header w-full flex flex-col justify-start items-center mb-10"
        >
          <h1 className="text-5xl font-figtree font-semibold mb-3">
            Welcome to
            <span className="font-dmsans font-bold">
              <span className="text-white">{" b"}</span>
              <span className="text-red-500">l</span>
              <span className="text-blue-600">d</span>
              <span className="text-yellow-300">r</span>
            </span>
          </h1>
          <h2 className="text-3xl font-dmsans text-[#A8A8A8] ">
            Flagship Schedule Builder
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="login-form flex flex-col justify-center items-center w-fit border border-[#404040] p-10 rounded-lg"
        >
          <div className="form-header w-full flex flex-col justify-start items-start mb-2">
            <h1 className="text-3xl font-bold font-dmsans mb-2 ">Sign up</h1>
            <h2 className="text-[#A8A8A8] text-xs font-inter mb-4">
              Please enter your email and password to continue
            </h2>
          </div>
          <form className="flex flex-col gap-4 w-96" onSubmit={handleClick}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Label htmlFor="email" className="text-sm font-inter mb-2 block">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="your.email@example.com"
                className={`font-inter border-[#404040] border-2 selection:bg-blue-400`}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Label
                htmlFor="password"
                className="text-sm font-inter mb-2 block"
              >
                Password
              </Label>
              <Input
                type="password"
                id="password"
                placeholder="At least 6 characters"
                className={`font-inter border-[#404040] border-2 selection:bg-blue-400`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Label
                htmlFor="confirm-password"
                className="text-sm font-inter mb-2 block"
              >
                Confirm Password
              </Label>
              <Input
                type="password"
                id="confirm-password"
                placeholder="Re-enter password"
                className={`font-inter border-[#404040] border-2 selection:bg-blue-400`}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Button
                type="submit"
                variant={"secondary"}
                className={`w-full transition cursor-pointer font-dmsans text-md my-3`}
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </motion.div>
          </form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="text-[#a8a8a8] text-xs mt-3 font-inter"
          >
            Already have an account with us?{" "}
            <Link href={"/"} className="font-medium text-white font-inter">
              Log in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
