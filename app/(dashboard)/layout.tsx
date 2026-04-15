import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DEMO_COOKIE = "documente-demo";

/**
 * Layout del Dashboard
 *
 * Permite dos modos de acceso:
 *  1. Sesión activa de Clerk (userId presente)
 *  2. Modo Demo: cookie `documente-demo=1` establecida por /login?demo=true
 *
 * El middleware ya hace un primer bypass; este layout agrega la verificación
 * de seguridad en SSR para que el build no rompa con el double-check.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar modo demo primero (no necesita Clerk)
  const cookieStore = await cookies();
  const isDemo = cookieStore.get(DEMO_COOKIE)?.value === "1";

  if (!isDemo) {
    // Si no es demo, exigir sesión de Clerk
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      {children}
    </div>
  );
}
