"use client";
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
import AuthSheet, {
  authInputClass,
  authLabelClass,
} from "@/components/AuthSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppToast } from "@/hooks/use-app-toast";
import { createClient } from "@/lib/supabase/client";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const appToast = useAppToast();

  const handleClick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      appToast.warning("Passwords do not match", {
        action: "account",
        description: "Please ensure both password fields match.",
        duration: 3000,
        icon: <XCircle className="h-5 w-5 text-yellow-500" />,
      });
      return;
    }

    if (password.length < 6) {
      appToast.error("Password must be at least 6 characters long", {
        action: "account",
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
        appToast.error("Signup Failed", {
          action: "account",
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        });
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          appToast.error("User already exists", {
            action: "account",
            duration: 3000,
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          });
          return;
        }

        appToast.success("Account Created", {
          action: "account",
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
      appToast.error("Error", {
        action: "account",
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSheet
      slip="New student form"
      title="Sign up"
      description="A free account keeps your plans, backup versions and share links."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-crimson underline decoration-[1.5px] underline-offset-[3px]"
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="mt-7 flex flex-col gap-5" onSubmit={handleClick}>
        <div>
          <Label htmlFor="email" className={authLabelClass}>
            Email
          </Label>
          <Input
            type="email"
            id="email"
            autoComplete="email"
            placeholder="jayhawk@ku.edu"
            className={authInputClass}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="password" className={authLabelClass}>
            Password
          </Label>
          <Input
            type="password"
            id="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className={authInputClass}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="confirm-password" className={authLabelClass}>
            Confirm password
          </Label>
          <Input
            type="password"
            id="confirm-password"
            autoComplete="new-password"
            placeholder="Type it again"
            className={authInputClass}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-1 h-12 w-full text-[17px] font-extrabold [font-stretch:92%]"
          disabled={isLoading}
        >
          {isLoading ? "Creating your account…" : "Create account"}
        </Button>
      </form>
    </AuthSheet>
  );
}
