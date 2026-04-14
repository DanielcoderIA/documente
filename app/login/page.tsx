"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Lógica de Auto-Login de Emergencia para Next.js 16 / Clerk 7.
 * Esta versión utiliza un bypass de tipado completo para evitar errores de inferencia
 * en versiones experimentales (SignInSignalValue).
 */
function AutoLoginLogic() {
  // useAuth para detección de sesión activa (prioridad SRE)
  const auth = useAuth() as any;
  
  // Bypass total de tipos para useSignIn debido a discrepancias en el SDK v7
  const signInResource = useSignIn() as any;
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isDemo = searchParams.get("demo") === "true";
  const attempted = useRef(false);

  useEffect(() => {
    // 1. Detección de sesión activa (Fix del Bucle)
    if (auth.isLoaded && auth.userId) {
      console.log("[SRE Audit] Sesión activa detectada (userId):", auth.userId);
      router.push("/dashboard");
      attempted.current = true;
      return;
    }

    // 2. Esperar a que el sistema de autenticación esté cargado
    if (!auth.isLoaded || !signInResource?.isLoaded || attempted.current) return;

    if (isDemo) {
      const performAutoLogin = async () => {
        attempted.current = true;
        
        // Validación en tiempo de ejecución de recursos de Clerk
        const signIn = signInResource?.signIn;
        const setActive = signInResource?.setActive;
        
        if (!signIn || !setActive) {
          console.error("[SRE Audit] Métodos de Clerk no detectados. Reintentando flujo manual.");
          router.push("/sign-in");
          return;
        }

        try {
          const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
          const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

          if (!email || !password) {
            console.error("[SRE Audit] Error: Variables de entorno no resueltas en el bundle del cliente.");
            router.push("/sign-in");
            return;
          }

          console.log("[SRE Audit] Ejecutando secuencia de acceso para consultor demo...");

          // PASO 1: Crear el intento con manejo de errores granular
          const result = await signIn.create({
            identifier: email,
          });

          // Manejo del objeto de error que puede devolver Clerk 7 en ciertos estados
          if ((result as any).error) {
            console.error("[SRE Audit] Clerk devolvió un error en la creación:", (result as any).error);
            router.push("/sign-in");
            return;
          }

          // PASO 2: Autenticación de primer factor
          // Usamos validación dinámica para el método ya que el tipo puede variar
          if (typeof result.authenticateWithFirstFactor !== "function") {
             console.error("[SRE Audit] El recurso de Clerk no soporta 'authenticateWithFirstFactor' en esta versión.");
             router.push("/sign-in");
             return;
          }

          const attempt = await result.authenticateWithFirstFactor({
            strategy: "password",
            password: password,
          });

          if (attempt.status === "complete") {
            console.log("[SRE Audit] Autenticación completada con éxito.");
            
            // PASO 3: Activar sesión
            await setActive({ session: attempt.createdSessionId });
            
            // Flag de sesión demo para el Dashboard
            sessionStorage.setItem("showDemoToast", "true");
            
            // Salto final al dashboard
            router.push("/dashboard");
          } else {
            console.warn("[SRE Audit] El estado de la sesión es:", attempt.status);
            router.push("/sign-in");
          }
        } catch (err: any) {
          console.error("[SRE Audit] Excepción crítica en el proceso de Auto-Login:", err.message || err);
          router.push("/sign-in");
        }
      };

      performAutoLogin();
    } else {
      // Si no es demo, redirigimos al sign-in convencional
      attempted.current = true;
      router.push("/sign-in");
    }
  }, [auth.isLoaded, auth.userId, signInResource, isDemo, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#1e1b4b]">
      <div className="flex flex-col items-center gap-4 bg-[#1e1e1e]/80 p-8 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-md w-full max-w-sm mx-auto">
        <Loader2 className="h-10 w-10 animate-spin text-[#1D9E75]" />
        <h2 className="text-white text-lg font-medium tracking-tight">Verificando acceso de consultor...</h2>
        <p className="text-slate-400 text-sm mt-1">Conexión con el núcleo de seguridad de DocuMente</p>
      </div>
    </div>
  );
}

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