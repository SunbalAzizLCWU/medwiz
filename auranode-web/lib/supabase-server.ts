import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name: key, value, ...options });
          } catch {}
        },
        remove(key: string, options: CookieOptions) {
          try {
            cookieStore.set({ name: key, value: "", ...options });
          } catch {}
        },
      },
    }
  );
}
