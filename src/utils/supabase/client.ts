import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  browserClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
