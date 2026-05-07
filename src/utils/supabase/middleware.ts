import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

type CookieRecord = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

type MiddlewareCookieStore = {
  getAll: () => CookieRecord[];
  setAll: (cookies: CookieRecord[]) => void;
};

export function createClient(cookieStore: MiddlewareCookieStore) {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookieStore.setAll(cookiesToSet);
      },
    },
  });
}
