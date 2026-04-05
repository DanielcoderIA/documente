/**
 * Cliente de Supabase para el NAVEGADOR (componentes Client)
 * Usa @supabase/ssr para compatibilidad con Next.js App Router
 * NO incluye service_role — solo acceso con permisos de usuario
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Singleton para evitar múltiples instancias en el cliente
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
