import { SUPABASE_CONFIG } from "./supabaseConfig.js";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.publishableKey);
}

export async function createSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey);
}
