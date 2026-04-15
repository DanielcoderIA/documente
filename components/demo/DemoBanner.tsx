"use client";

import { useRouter } from "next/navigation";
import { FlaskConical, X } from "lucide-react";

const DEMO_COOKIE = "documente-demo";

/**
 * DemoBanner — Badge / aviso sutil que aparece en el Dashboard en Modo Demo.
 * Diseño: Tech-Noir / Brutalista — borde verde #1D9E75, fondo oscuro, monospace.
 */
export function DemoBanner() {
  const router = useRouter();

  const handleExit = () => {
    // Eliminar la cookie de demo
    document.cookie = `${DEMO_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    router.push("/sign-in");
  };

  return (
    <div
      role="status"
      aria-label="Modo Demo Activo"
      className="
        flex items-center justify-between
        px-3 py-1.5
        bg-[#111] border-b border-[#1D9E75]/40
        text-[11px] font-mono tracking-widest
        select-none z-50
      "
    >
      {/* Izquierda: ícono + texto */}
      <div className="flex items-center gap-2">
        {/* Dot pulsante */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D9E75]" />
        </span>
        <FlaskConical size={11} className="text-[#1D9E75]" />
        <span className="text-[#1D9E75] uppercase">Modo Demo Activo</span>
        <span className="text-[rgba(255,255,255,0.25)] mx-1">·</span>
        <span className="text-[rgba(255,255,255,0.3)]">
          Los datos mostrados son de prueba y no representan información real.
        </span>
      </div>

      {/* Derecha: botón salir */}
      <button
        onClick={handleExit}
        aria-label="Salir del modo demo"
        className="
          flex items-center gap-1 ml-4 px-2 py-0.5
          border border-[rgba(255,255,255,0.1)]
          text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)]
          hover:border-[rgba(255,255,255,0.25)]
          transition-colors duration-150
        "
      >
        <X size={9} />
        <span>Salir</span>
      </button>
    </div>
  );
}
