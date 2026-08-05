// One-off: create the admin user in Supabase Auth.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(".env.local", "utf8");
const get = (k) => env.split("\n").find((l) => l.startsWith(`${k}=`))?.split("=").slice(1).join("=");

const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"));

const { data, error } = await sb.auth.admin.createUser({
  email: "ggraphixc@gmail.com",
  password: "Godson@1135",
  email_confirm: true,
  user_metadata: { role: "admin" },
});

if (error) {
  console.error("CREATE FAILED:", error.message);
  process.exit(1);
}
console.log("ADMIN CREATED:", data.user?.email, "| id:", data.user?.id);
