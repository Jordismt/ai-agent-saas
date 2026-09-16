import { supabase } from "../infrastructure/supabase/supabaseClient.js";

export async function authGuard() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return "/login";
  }

  return true;
}
