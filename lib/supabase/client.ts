import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import type { Database } from "@/types/database";

export function useSupabaseClient() {
  const { session } = useSession();

  // useMemo evita crear una nueva instancia en cada render
  return useMemo(() => {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Deshabilitamos Supabase Auth — usamos Clerk
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken({ template: "supabase" });
            const headers = new Headers(options.headers);
            if (clerkToken) headers.set("Authorization", `Bearer ${clerkToken}`);
            return fetch(url, { ...options, headers });
          },
        },
      }
    );
  }, [session]);
}