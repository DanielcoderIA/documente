"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

/**
 * DemoButton: Componente modular para el portafolio que permite un acceso
 * programático rápido sin pasar por formularios de registro.
 */
export function DemoButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = () => {
    setIsLoading(true);
    router.push("/login?demo=true");
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#252526] text-white border border-[rgba(255,255,255,0.1)] transition-colors rounded-lg py-2.5 px-4 text-sm font-medium shadow-sm disabled:opacity-50 group relative overflow-hidden"
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
    </div>
  );
}
