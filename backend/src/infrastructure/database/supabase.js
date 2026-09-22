import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;

const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export function createSupabaseClient(accessToken = null) {
  if (!accessToken) {
    return supabase;
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function createSupabaseServerClient() {
  if (!supabaseSecretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY environment variable");
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
