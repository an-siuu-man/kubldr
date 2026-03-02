"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import toastStyle from "@/components/ui/toastStyle";
import { motion } from "framer-motion";

export default function UpgradeAccount() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const supabase = createClient();

  // Check if user is a guest
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in, redirect to login
          router.push("/");
          return;
        }

        if (user.is_anonymous) {
          setIsGuest(true);
        } else {
          // Already has a real account, redirect to builder
          toast.success("You already have an account!", {
            style: toastStyle,
            duration: 2000,
          });
          router.push("/builder");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUser();
  }, [router, supabase.auth]);

  const handleUpgrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast("Passwords do not match", {
        style: toastStyle,
        description: "Please ensure both password fields match.",
        duration: 3000,
        icon: <XCircle className="h-5 w-5" />,
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long", {
        style: toastStyle,
        duration: 3000,
        icon: <Lock className="h-5 w-5" />,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use updateUser to convert anonymous account to permanent account
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) {
        toast.error("Upgrade Failed", {
          style: toastStyle,
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5" />,
        });
        return;
      }

      if (data.user) {
        toast.success("Account Created!", {
          style: toastStyle,
          description:
            "Please check your email to verify your account, then log in.",
          duration: 5000,
          icon: <CheckCircle2 className="h-5 w-5" />,
        });

        // Sign out the anonymous session and redirect to login
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Error", {
        style: toastStyle,
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-dmsans mb-2">Loading...</h2>
          <p className="text-[#A8A8A8] font-inter">Please wait</p>
        </div>
      </div>
    );
  }

  if (!isGuest) {
    return null;
  }

  return (
    <div className="upgrade-page">
      <div className="flex flex-col justify-start items-center h-screen py-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="header w-full flex flex-col justify-start items-center mb-10"
        >
          <h1 className="text-5xl font-figtree font-semibold mb-3">
            Upgrade to
            <span className="font-dmsans font-bold">
              <span className="text-white">{" b"}</span>
              <span className="text-red-500">l</span>
              <span className="text-blue-600">d</span>
              <span className="text-yellow-300">r</span>
            </span>
          </h1>
          <h2 className="text-3xl font-dmsans text-[#A8A8A8] ">
            Save your schedules permanently
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="upgrade-form flex flex-col justify-center items-center w-fit border border-[#404040] p-10 rounded-lg"
        >
          <div className="form-header w-full flex flex-col justify-start items-start mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h1 className="text-3xl font-bold font-dmsans">
                Create Your Account
              </h1>
            </div>
            <h2 className="text-[#A8A8A8] text-xs font-inter mb-4">
              Your existing schedules will be linked to your new account
            </h2>
          </div>
          <form className="flex flex-col gap-4 w-96" onSubmit={handleUpgrade}>
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
                {isLoading ? (
                  <>
                    <Spinner />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade Account
                  </>
                )}
              </Button>
            </motion.div>
          </form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="text-[#a8a8a8] text-xs mt-3 font-inter"
          >
            <Link
              href="/builder"
              className="font-medium text-white font-inter inline-flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to builder
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
