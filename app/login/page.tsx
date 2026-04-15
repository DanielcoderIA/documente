"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const DEMO_COOKIE = "documente-demo";

/**
 * LoginPage — Ruta de aterrizaje para el DemoButton.
 *
 * Si ?demo=true está presente:
 *   1. Escribe la cookie `documente-demo=1` (SameSite=Lax, no HttpOnly para que
 *      el middleware del Edge la pueda leer vía `req.cookies`).
 *   2. Redirige a /dashboard — el middleware la detecta y permite el acceso.
 *
 * Si no hay parámetro demo, redirige al sign-in convencional.
 */
function LoginLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = searchParams.get("demo") === "true";

  useEffect(() => {
    if (isDemo) {
      // Escribir cookie de sesión demo (expira en 2 horas)
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${DEMO_COOKIE}=1; path=/; expires=${expires}; SameSite=Lax`;

      // Pequeño delay para que la cookie se registre antes de la navegación
      const t = setTimeout(() => router.push("/dashboard"), 80);
      return () => clearTimeout(t);
    } else {
      router.push("/sign-in");
    }
  }, [isDemo, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-4 bg-[#252526] p-8 border border-[rgba(255,255,255,0.08)] w-full max-w-sm mx-auto">
        <div className="h-px w-full bg-[#1D9E75] mb-2" />
        <Loader2 className="h-8 w-8 animate-spin text-[#1D9E75]" />
        <p className="text-[#cccccc] text-sm font-mono tracking-widest uppercase">
          {isDemo ? "Iniciando modo demo..." : "Redirigiendo..."}
        </p>
        <div className="h-px w-full bg-[rgba(255,255,255,0.06)]" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1D9E75]" />
        </div>
      }
    >
      <LoginLogic />
    </Suspense>
  );
}