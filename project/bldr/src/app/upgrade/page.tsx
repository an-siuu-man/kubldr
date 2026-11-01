"use client";
import { AlertTriangle, CheckCircle2, Lock, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthSheet, {
  authInputClass,
  authLabelClass,
} from "@/components/AuthSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAppToast } from "@/hooks/use-app-toast";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeAccount() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const supabase = createClient();
  const appToast = useAppToast();

  // Check if user is a guest
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in, redirect to login
          router.push("/login");
          return;
        }

        if (user.is_anonymous) {
          setIsGuest(true);
        } else {
          // Already has a real account, redirect to builder
          appToast.success("You already have an account!", {
            action: "account",
            duration: 2000,
            icon: <CheckCircle2 className="h-5 w-5 text-success" />,
          });
          router.push("/builder");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUser();
  }, [appToast, router, supabase.auth]);

  const handleUpgrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      appToast.warning("Passwords do not match", {
        action: "account",
        description: "Please ensure both password fields match.",
        duration: 3000,
        icon: <XCircle className="h-5 w-5 text-warning" />,
      });
      return;
    }

    if (password.length < 6) {
      appToast.error("Password must be at least 6 characters long", {
        action: "account",
        duration: 3000,
        icon: <Lock className="h-5 w-5 text-destructive" />,
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
        appToast.error("Upgrade Failed", {
          action: "account",
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-destructive" />,
        });
        return;
      }

      if (data.user) {
        appToast.success("Account Created!", {
          action: "account",
          description:
            "Please check your email to verify your account, then log in.",
          duration: 5000,
          icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        });

        // Sign out the anonymous session and redirect to login
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      appToast.error("Error", {
        action: "account",
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-desk">
        <p className="form-label flex items-center gap-2">
          <Spinner className="h-4 w-4" /> Checking your session…
        </p>
      </div>
    );
  }

  if (!isGuest) {
    return null;
  }

  return (
    <AuthSheet
      slip="Guest to student form"
      title="Keep your schedules"
      description="Make your guest session a free account. The schedules you've built stay linked to it."
      backHref="/builder"
      backLabel="Back to builder"
      footer={
        <Link
          href="/builder"
          className="font-bold text-crimson underline decoration-[1.5px] underline-offset-[3px]"
        >
          Not now, back to the builder
        </Link>
      }
    >
      <form className="mt-7 flex flex-col gap-5" onSubmit={handleUpgrade}>
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
          {isLoading ? (
            <>
              <Spinner />
              Saving your account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthSheet>
  );
}
