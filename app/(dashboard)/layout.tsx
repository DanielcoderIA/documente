import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Layout del Dashboard
 * Verifica autenticación en el servidor antes de renderizar
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificación de sesión — el middleware ya protege la ruta,
  // pero esta verificación doble garantiza seguridad en SSR
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    // Ocupa toda la pantalla sin scroll externo
    <div className="h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      {children}
    </div>
  );
}
