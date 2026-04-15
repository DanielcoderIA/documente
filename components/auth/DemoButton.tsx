"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

/**
 * DemoButton: Componente modular para el portafolio que permite un acceso
 * programático rápido sin pasar por formularios de registro.
 * Utiliza Clerk SDK con inferencia omitida por compatibilidad con versiones experimentales.
 */
export function DemoButton() {
  // Inferencia explícita a 'any' para soporte robusto de Next 15 / Clerk 7
  const signInResource = useSignIn() as any;
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDemoLogin = async () => {
    // Verificamos si el recurso principal cargó
    if (!signInResource?.isLoaded) {
      setErrorMsg("El sistema de autenticación aún está iniciando.");
      return;
    }

    const signIn = signInResource.signIn;
    const setActive = signInResource.setActive;

    if (!signIn || !setActive) {
      setErrorMsg("Servicio inaccesible temporalmente.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
      const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

      if (!email || !password) {
        throw new Error("Credenciales de demo no configuradas.");
      }

      // PASO 1: Iniciar creación del intento (ignora inferencia)
      const result = await signIn.create({
        identifier: email,
      });

      if (result?.error) {
        throw new Error(result.error.message || "Error en validación de Clerk");
      }

      // PASO 2: Proveer el Password como factor primario
      if (typeof result.authenticateWithFirstFactor !== "function") {
        throw new Error("La versión actual de Clerk no soporta este método.");
      }

      const attempt = await result.authenticateWithFirstFactor({
        strategy: "password",
        password: password,
      });

      // PASO 3: Validación final y activación
      if (attempt.status === "complete") {
        // Activamos en el lado del cliente
        await setActive({ session: attempt.createdSessionId });
        
        // Colocamos el flag para el Toast de bienvenida en la UI
        sessionStorage.setItem("showDemoToast", "true");
        
        // Redirigir hacia la vista de gestión
        router.push("/dashboard");
      } else {
        throw new Error(`Requiere verificación adicional (Estado: ${attempt.status})`);
      }
    } catch (err: any) {
      console.error("[DemoButton] Error:", err);
      // Extraemos el mensaje legible si es un error de Clerk
      const errorText = err.errors?.[0]?.longMessage || err.message || "Ocurrió un error inesperado al procesar el acceso.";
      setErrorMsg(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading || !signInResource?.isLoaded}
        className="w-full flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#252526] text-white border border-[rgba(255,255,255,0.1)] transition-colors rounded-lg py-2.5 px-4 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
      >
        {/* Efecto de resplandor hover de UI Premium */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r from-[#1D9E75] to-transparent" />
        
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#1D9E75] relative z-10" />
        ) : (
          <Zap className="w-4 h-4 text-[#1D9E75] relative z-10" />
        )}
        <span className="relative z-10 tracking-tight">
          {isLoading ? "Iniciando modo demo..." : "Ver App en Modo Demo"}
        </span>
      </button>
      
      {errorMsg && (
        <p className="text-red-400 text-xs text-center font-medium opacity-90 tracking-tight">
           {errorMsg}
        </p>
      )}
    </div>
  );
}
