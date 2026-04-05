"use client";

import { Brain, Crown, ChevronDown, Loader2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProyectoUI } from "@/types/app";

interface SidebarProps {
  proyectos: ProyectoUI[];
  loading?: boolean;
  proyectoActivoId: string | null;
  onSeleccionar: (id: string) => void;
  onNuevoProyecto: () => void;
}

export function Sidebar({
  proyectos,
  loading = false,
  proyectoActivoId,
  onSeleccionar,
  onNuevoProyecto,
}: SidebarProps) {
  return (
    <aside
      className="
        flex flex-col h-full w-[200px] flex-shrink-0
        bg-[#252526] border-r border-[rgba(255,255,255,0.06)]
        select-none
      "
    >
      {/* ── LOGO ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1D9E75] shadow-lg shadow-[rgba(29,158,117,0.3)]">
          <Brain size={15} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">
          Docu<span className="text-[#1D9E75]">Mente</span>
        </span>
      </div>

      {/* ── PROYECTOS ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pt-3 pb-2">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#636363]">
            Proyectos
          </span>
          {!loading && (
            <span className="text-[10px] text-[#636363]">
              {proyectos.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 px-2.5 mt-2">
            <Skeleton className="h-8 w-full bg-[rgba(255,255,255,0.04)] rounded-md" />
            <Skeleton className="h-8 w-full bg-[rgba(255,255,255,0.04)] rounded-md cursor-not-allowed" />
            <Skeleton className="h-8 w-4/5 bg-[rgba(255,255,255,0.04)] rounded-md cursor-not-allowed" />
          </div>
        ) : (
          <ProjectList
            proyectos={proyectos}
            proyectoActivoId={proyectoActivoId}
            onSeleccionar={onSeleccionar}
            onNuevoProyecto={onNuevoProyecto}
          />
        )}
      </div>

      {/* ── USUARIO + PLAN ─────────────────────────────────── */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]">
          <Crown size={10} className="text-[#F59E0B] flex-shrink-0" />
          <span className="text-[10px] font-medium text-[#F59E0B] truncate">
            Plan Pro · $25.000 COP
          </span>
        </div>

        <div className="flex items-center gap-2 px-1.5">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-6 h-6",
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#cccccc] truncate">
              Mi cuenta
            </p>
          </div>
          <ChevronDown size={10} className="text-[#636363] flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
