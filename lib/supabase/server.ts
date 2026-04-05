/**
 * Cliente de Supabase para el SERVIDOR (Server Components, API Routes, Server Actions)
 * Usa cookies de Next.js para mantener la sesión en el servidor
 * Exporta también createAdminClient para operaciones con service_role
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cliente estándar con anon key — respeta las políticas RLS
 * Usar en Server Components y API Routes normales
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components no pueden mutar cookies — ignorar
          }
        },
      },
    }
  );
}

/**
 * Cliente administrador con service_role — BYPASEA las políticas RLS
 * Usar SOLO en API Routes del servidor (webhooks, procesamiento de PDFs, etc.)
 * NUNCA exponer al cliente
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
