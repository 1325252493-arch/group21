import { createClient } from "@supabase/supabase-js";
import { appParams } from "@/lib/app-params";

export const supabase = createClient(appParams.supabaseUrl, appParams.supabaseAnonKey);

// Small helper: throw on error to simplify callers
export const assertNoSupabaseError = (res) => {
  if (!res) return;
  if (res.error) {
    const msg = res.error.message || JSON.stringify(res.error);
    throw new Error(msg);
  }
};