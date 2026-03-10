import { redirect } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { createClient } from "@/lib/supabase/server";

export default async function Login() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/builder");
  }

  return <LoginPage />;
}
