import { createBrowserClient } from "@supabase/ssr";

// Module-level singleton — prevents a new client being instantiated on every
// component render, which was causing redundant auth state subscriptions and
// unnecessary cookie parsing on each re-render.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
