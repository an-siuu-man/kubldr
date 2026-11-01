"use client";

import { AlertTriangle, CheckCircle2, UserCircle, XCircle } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { useAppToast } from "@/hooks/use-app-toast";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const supabase = createClient();
  const appToast = useAppToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        appToast.error("Login Failed", {
          action: "auth",
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        });
        return;
      }

      if (data.user) {
        appToast.success("Login Successful", {
          action: "auth",
          description: "Redirecting to builder...",
          duration: 2000,
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        });
        router.push("/builder");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      appToast.error("Error", {
        action: "auth",
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
        appToast.error("Guest Login Failed", {
          action: "auth",
          description: error.message,
          duration: 3000,
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        });
        return;
      }

      if (data.user) {
        appToast.success("Welcome, Guest!", {
          action: "auth",
          description: "Redirecting to builder...",
          duration: 2000,
          icon: <UserCircle className="h-5 w-5 text-green-500" />,
        });
        router.push("/builder");
        router.refresh();
      }
    } catch (error) {
      console.error("Guest login error:", error);
      appToast.error("Error", {
        action: "auth",
        description: "An unexpected error occurred",
        duration: 3000,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <AuthSheet
      slip="Student sign-in slip"
      title="Log in"
      description="Pick up where you left off: your saved plans, versions and share links."
      footer={
        <>
          New to bldr?{" "}
          <Link
            href="/signup"
            className="font-bold text-crimson underline decoration-[1.5px] underline-offset-[3px]"
          >
            Create a free account
          </Link>
        </>
      }
    >
      <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email" className={authLabelClass}>
            Email
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            autoComplete="email"
            placeholder="jayhawk@ku.edu"
            className={authInputClass}
            required
            disabled={isLoading || isGuestLoading}
          />
        </div>

        <div>
          <Label htmlFor="password" className={authLabelClass}>
            Password
          </Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            autoComplete="current-password"
            className={authInputClass}
            required
            disabled={isLoading || isGuestLoading}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-1 h-12 w-full text-[17px] font-extrabold [font-stretch:92%]"
          disabled={isLoading || isGuestLoading}
        >
          {isLoading ? (
            <>
              <Spinner />
              Logging in…
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <div className="mt-6 border-2 border-dashed border-rule-strong p-4">
        <p className="form-label">Just looking?</p>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
          Build schedules without an account. You can sign up later to keep
          them.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-11 w-full border-2 border-crimson bg-transparent text-[16px] font-extrabold text-crimson [font-stretch:92%] hover:bg-accent hover:text-crimson"
          disabled={isLoading || isGuestLoading}
          onClick={handleGuestLogin}
        >
          {isGuestLoading ? (
            <>
              <Spinner />
              Opening the builder…
            </>
          ) : (
            <>
              <UserCircle className="h-4 w-4" />
              Continue as guest
            </>
          )}
        </Button>
      </div>
    </AuthSheet>
  );
}
