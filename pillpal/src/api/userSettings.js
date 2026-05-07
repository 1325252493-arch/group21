import { supabase, assertNoSupabaseError } from "@/api/supabaseClient";

export const FONT_SCALE_NORMAL = 100;
export const FONT_SCALE_LARGE = 140;

/**
 * Converts font scale percentage to px value.
 * Adjusts for mobile screens to prevent text overflow in Elderly Mode.
 * @param {number|string} scale 
 * @returns {string}
 */
export const fontScaleToPx = (scale) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const numScale = Number(scale);

  if (numScale >= 140) {
    // Elderly Mode: Use 22px on Desktop, but 19px on Mobile for better fit
    return isMobile ? "19px" : "22px";
  }
  
  // Standard Mode: Default 16px
  return "16px";
};

/**
 * Fetch settings for a specific user
 */
export async function getUserSettings(userId) {
  if (!userId) return null;

  const res = await supabase
    .from("user_settings")
    .select("user_id,sound_enabled,font_scale,updated_at")
    .eq("user_id", userId)
    .limit(1);

  assertNoSupabaseError(res);
  return res.data?.[0] || null;
}

/**
 * Create or update user settings
 */
export async function upsertUserSettings(userId, defaults) {
  if (!userId) return null;

  const res = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...defaults,
      },
      { onConflict: "user_id" }
    )
    .select("user_id,sound_enabled,font_scale,updated_at")
    .single();

  assertNoSupabaseError(res);
  return res.data;
}

/**
 * Patch existing user settings
 */
export async function updateUserSettings(userId, patch) {
  if (!userId) return null;

  const res = await supabase
    .from("user_settings")
    .update(patch)
    .eq("user_id", userId)
    .select("user_id,sound_enabled,font_scale,updated_at")
    .single();

  assertNoSupabaseError(res);
  return res.data;
}