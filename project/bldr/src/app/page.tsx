"use client";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, UserCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import toastStyle from "@/components/ui/toastStyle";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          router.push("/builder");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkUser();
  }, [router, supabase.auth]);

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
          icon: <XCircle className="h-5 w-5" />,
        });
        return;
      }

      if (data.user) {
        toast.success("Login Successful", {
          style: toastStyle,
          description: "Redirecting to builder...",
          duration: 2000,
          icon: <CheckCircle2 className="h-5 w-5" />,
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
        icon: <AlertTriangle className="h-5 w-5" />,
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
          icon: <XCircle className="h-5 w-5" />,
        });
        return;
      }

      if (data.user) {
        toast.success("Welcome, Guest!", {
          style: toastStyle,
          description: "Redirecting to builder...",
          duration: 2000,
          icon: <UserCircle className="h-5 w-5" />,
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
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    } finally {
      setIsGuestLoading(false);
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

  return (
    <div className="landing-page ">
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
            <h1 className="text-3xl font-bold font-dmsans mb-2 ">Login</h1>
            <h2 className="text-[#A8A8A8] text-xs font-inter mb-4">
              Please enter your email and password to continue
            </h2>
          </div>
          <form className="flex flex-col gap-4 w-96" onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="w-full flex justify-between items-center mb-2">
                <Label htmlFor="email" className="text-sm font-inter">
                  Email
                </Label>
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                placeholder="your.email@example.com"
                className={`font-inter selection:bg-blue-400 border-[#404040] border-2`}
                required
                disabled={isLoading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="w-full flex justify-between items-center mb-2">
                <Label htmlFor="password" className="text-sm font-inter">
                  Password
                </Label>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                placeholder="********"
                className={`font-inter selection:bg-blue-400 border-[#404040] border-2`}
                required
                disabled={isLoading}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Button
                type="submit"
                variant={"secondary"}
                className={`w-full cursor-pointer font-dmsans text-md my-3`}
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
              <div className="relative w-full flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#404040]"></div>
                </div>
                <span className="relative bg-[#080808] px-3 text-xs text-[#a8a8a8] font-inter">
                  or
                </span>
              </div>
              <Button
                type="button"
                variant={"outline"}
                className={`w-full cursor-pointer font-dmsans text-md border-[#404040]`}
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
                    <UserCircle className="h-4 w-4 mr-2" />
                    Continue as Guest
                  </>
                )}
              </Button>
            </motion.div>
          </form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="text-[#a8a8a8] text-xs mt-3 font-inter"
          >
            Don't have an account with us?{" "}
            <Link
              href={"/signup"}
              className="font-medium text-white font-inter"
            >
              Sign up
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
