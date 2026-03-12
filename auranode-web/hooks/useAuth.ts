"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        setUser(null);
      } else {
        setUser(data as unknown as User);
      }
    },
    [supabase]
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser && mounted) {
        await fetchUserProfile(authUser.id);
      } else if (mounted) {
        setUser(null);
      }

      if (mounted) setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        setLoading(true);
        await fetchUserProfile(session.user.id);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return { user, loading, signOut };
}
