import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};
const response = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers });

// Public password-login endpoint: authentication happens here, not in the JWT gateway.
// Wildcard CORS permits development hosts; no cookies/ambient credentials are used.
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return response(405, { error: "Method not allowed." });
  try {
    const text = await request.text();
    if (text.length > 4096) return response(400, { error: "Invalid request." });
    const body = JSON.parse(text);
    if (
      typeof body.studentNumber !== "string" ||
      typeof body.password !== "string" ||
      body.studentNumber.length > 80 ||
      body.password.length > 256 ||
      !body.password
    )
      return response(400, { error: "Enter your student number and password." });
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      db: { schema: "fieldnotes" },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userId, error } = await admin.rpc("resolve_student_login", {
      student_number_input: body.studentNumber,
    });
    if (error) return response(503, { error: "Sign-in is unavailable. Try again." });
    const invalid = () =>
      response(401, {
        error: "The student number or password is incorrect, or sign-in is temporarily limited.",
      });
    if (!userId) return invalid();
    const { data } = await admin.auth.admin.getUserById(userId);
    if (!data.user?.email) return invalid();
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signedIn = await auth.auth.signInWithPassword({
      email: data.user.email,
      password: body.password,
    });
    if (signedIn.error || !signedIn.data.session) return invalid();
    return response(200, {
      access_token: signedIn.data.session.access_token,
      refresh_token: signedIn.data.session.refresh_token,
    });
  } catch {
    return response(400, { error: "Unable to sign in. Check your details and try again." });
  }
});
