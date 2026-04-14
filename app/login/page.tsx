"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Lógica de Auto-Login para el modo Demo.
 * Implementa el estándar de Freeflow CRM para Clerk en Next.js 15/16.
 */
function AutoLoginLogic() {
  // 🛠️ Bypass táctico al bug de inferencia de Signals de Clerk
  const clerkAuth = useSignIn() as any;
  const isLoaded = clerkAuth.isLoaded;
  const signIn = clerkAuth.signIn;
  const setActive = clerkAuth.setActive;

  const searchParams = useSearchParams();
  const router = useRouter();

  const isDemo = searchParams.get("demo") === "true";
  const attempted = useRef(false);

  useEffect(() => {
    // Si Clerk aún no ha cargado, o ya intentamos el login, o no hay objeto signIn, salimos
    if (!isLoaded || !signIn || !setActive || attempted.current) return;

    if (isDemo) {
      const performAutoLogin = async () => {
        attempted.current = true;
        try {
          const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
          const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

          if (!email || !password) {
            console.error("Faltan las credenciales de demo en variables de entorno.");
            router.push("/sign-in");
            return;
          }

          // PASO 1: Crear el intento de inicio de sesión con el identificador
          // 🛠️ Cast a 'any' temporal para evadir el falso error de inferencia '{ error: ClerkError | null }'
          const result = (await signIn.create({
            identifier: email,
          })) as any;

          // PASO 2: Autenticar con el primer factor (Password) según estándar Clerk v5+
          const attempt = await result.authenticateWithFirstFactor({
            strategy: "password",
            password: password,
          });

          if (attempt.status === "complete") {
            // PASO 3: Activar la sesión
            await setActive({ session: attempt.createdSessionId });

            // Guardar flag para el Toast de bienvenida en el Dashboard
            sessionStorage.setItem("showDemoToast", "true");

            // Redirección final
            router.push("/dashboard");
          } else {
            console.warn("El inicio de sesión requiere factores adicionales:", attempt.status);
            router.push("/sign-in");
          }
        } catch (err) {
          console.error("Error crítico durante el Auto-Login de consultor:", err);
          // Si falla el auto-login, regresamos al sign-in manual por seguridad
          router.push("/sign-in");
        }
      };

      performAutoLogin();
    } else {
      // Si se entra a /login sin ?demo=true, redirigir al flujo normal
      attempted.current = true;
      router.push("/sign-in");
    }
  }, [isLoaded, signIn, setActive, isDemo, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#1e1b4b]">
      <div className="flex flex-col items-center gap-4 bg-[#1e1e1e]/80 p-8 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-md w-full max-w-sm mx-auto">
        <Loader2 className="h-10 w-10 animate-spin text-[#1D9E75]" />
        <h2 className="text-white text-lg font-medium tracking-tight">Verificando acceso de consultor...</h2>
        <p className="text-slate-400 text-sm mt-1">Iniciando modo de demostración segura</p>
      </div>
    </div>
  );
}

/**
 * Página de login envolviendo la lógica en Suspense para evitar deopt de Next.js
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#1e1b4b]">
          <Loader2 className="h-10 w-10 animate-spin text-[#1D9E75]" />
        </div>
      }
    >
      <AutoLoginLogic />
    </Suspense>
  );
}