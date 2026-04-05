"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Upload,
  FolderOpen,
} from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ModalNuevoProyecto } from "@/components/proyectos/ModalNuevoProyecto";
import { UploadPDF } from "@/components/upload/UploadPDF";
import { DocumentList } from "@/components/dashboard/DocumentList";
import { OCRPanel } from "@/components/dashboard/OCRPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

import { MENSAJES_MOCK } from "@/constants/mock-data";
import { useProyectos, Proyecto } from "@/hooks/useProyectos";
import type { ProyectoUI, MensajeChat } from "@/types/app";

/** Simula respuesta de IA con delay (se reemplaza en Sprint 5 con Claude API) */
async function simularRespuestaIA(pregunta: string, proyecto: ProyectoUI): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500));
  return `Analizando **${proyecto.cantidadDocs} documentos** del proyecto "${proyecto.nombre}"...\n\n` +
    `Sobre tu pregunta: "${pregunta.slice(0, 60)}${pregunta.length > 60 ? "..." : ""}"\n\n` +
    `• He revisado los documentos.\n` +
    `• Esta es una respuesta de demostración (Sprint 5 conectará Claude).`;
}

export default function DashboardPage() {
  // Proyectos reales desde Base de Datos a través del hook
  const { proyectos, loading, crearProyecto, recargarProyectos } = useProyectos();

  // ── ESTADO UI ───────────────────────────────────────────
  const [proyectoActivoId, setProyectoActivoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  
  // Visor PDF
  const [paginaActual, setPaginaActual] = useState(1);
  const [zoom, setZoom] = useState(100);
  
  // OCR y Documentos
  const [documentoSeleccionadoId, setDocumentoSeleccionadoId] = useState<string | null>(null);
  const [documentoSeleccionadoUrl, setDocumentoSeleccionadoUrl] = useState<string | null>(null);
  const [documentoSeleccionadoNombre, setDocumentoSeleccionadoNombre] = useState<string | null>(null);
  const [ocrAbierto, setOcrAbierto] = useState(false);
  const supabase = createClient();
  
  // Responsive / Layout
  const [mostrarSidebar, setMostrarSidebar] = useState(true);
  const [mostrarChat, setMostrarChat] = useState(true);

  // Modales
  const [modalNuevoProyectoAbierto, setModalNuevoProyectoAbierto] = useState(false);
  const [modalUploadAbierto, setModalUploadAbierto] = useState(false);



  const proyectoActivo = proyectos.find((p) => p.id === proyectoActivoId) ?? null;

  const totalPaginas = proyectoActivo
    ? Math.max(1, Math.ceil(proyectoActivo.cantidadDocs / 5))
    : 1;

  // ── HANDLERS ────────────────────────────────────────────

  const handleSeleccionarProyecto = (id: string) => {
    setProyectoActivoId(id);
    setPaginaActual(1);
    setDocumentoSeleccionadoId(null);
    setDocumentoSeleccionadoUrl(null);
    setDocumentoSeleccionadoNombre(null);
    setOcrAbierto(false);
  };

  const handleSeleccionarDocumento = async (doc: any) => {
    setDocumentoSeleccionadoId(doc.id);
    setDocumentoSeleccionadoNombre(doc.nombre_archivo);
    setDocumentoSeleccionadoUrl(null);

    // Regla de Oro: usar el path_storage puro de la base de datos sin alterar
    const rutaReal = doc.path_storage;

    console.log("Ruta REAL de la DB:", rutaReal);
    // Obtenemos URL Pública directa
    const { data } = supabase.storage
      .from('documentos')
      .getPublicUrl(rutaReal);

    setDocumentoSeleccionadoUrl(data.publicUrl);
  };

  const handleGuardarProyecto = async (nombre: string, color: string, descripcion: string) => {
    // Solución al tipado nulo tras la creación de proyecto
    const nuevo = await crearProyecto(nombre, color, descripcion);
    if (nuevo) {
      setProyectoActivoId(nuevo.id); 
      return nuevo;
    }
  };

  const handleUploadSuccess = () => {
    recargarProyectos();
  };

  // ── VISOR DE PDF AUX ────────────────────────────────────
  function handleZoomIn() { setZoom((z) => Math.min(z + 25, 200)); }
  function handleZoomOut() { setZoom((z) => Math.max(z - 25, 50)); }
  function handleZoomReset() { setZoom(100); }
  function handlePaginaAnterior() { setPaginaActual((p) => Math.max(1, p - 1)); }
  function handlePaginaSiguiente() { setPaginaActual((p) => Math.min(totalPaginas, p + 1)); }

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* ── MODALES ── */}
      <ModalNuevoProyecto 
        open={modalNuevoProyectoAbierto} 
        onOpenChange={setModalNuevoProyectoAbierto} 
        onGuardar={handleGuardarProyecto} 
      />

      <Dialog open={modalUploadAbierto} onOpenChange={setModalUploadAbierto}>
        <DialogContent className="max-w-xl bg-card border-border/20 text-foreground">
          <DialogHeader>
            <DialogTitle>Subir documentos a {proyectoActivo?.nombre}</DialogTitle>
          </DialogHeader>
          {proyectoActivo && (
            <UploadPDF 
              proyectoId={proyectoActivo.id} 
              onUploadSuccess={handleUploadSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ──────────── PANEL 1: SIDEBAR ──────────────────── */}
      <div className={`transition-all duration-200 overflow-hidden flex-shrink-0 ${mostrarSidebar ? "w-[200px]" : "w-0"}`}>
        <Sidebar
          proyectos={proyectos}
          loading={loading}
          proyectoActivoId={proyectoActivoId}
          onSeleccionar={handleSeleccionarProyecto}
          onNuevoProyecto={() => setModalNuevoProyectoAbierto(true)}
        />
      </div>

      {/* ──────────── PANEL 2: CENTRO (PDF VIEWER) ──────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#1e1e1e]">
        <Header
          proyectoActivo={proyectoActivo}
          onSubirPDF={() => {
            if (!proyectoActivo) {
              toast.error("Selecciona o crea un proyecto primero.");
            } else {
              setModalUploadAbierto(true);
            }
          }}
          onOCR={() => {
            if (!documentoSeleccionadoId) {
              toast.warning("Selecciona primero un documento de la lista.");
            } else {
              setOcrAbierto(true);
            }
          }}
          onExportar={() => toast.info(`Exportar disponible en Sprint 6`)}
        />

        <div className="flex flex-1 overflow-hidden flex-row">
          {/* ──────── PANEL INTERNO: LISTA DOCS ──────── */}
          {proyectoActivo && proyectoActivo.cantidadDocs > 0 && (
            <div className="w-[260px] bg-[#252526] border-r border-[rgba(255,255,255,0.06)] flex flex-col flex-shrink-0">
               <DocumentList 
                  documentos={proyectoActivo.documentos || []}
                  documentoSeleccionado={documentoSeleccionadoId}
                  onSeleccionar={handleSeleccionarDocumento}
               />
            </div>
          )}

          {/* Visor de PDF (Mock por ahora, real en S5) */}
          <div className="flex-1 overflow-hidden flex flex-col border-l border-[rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#252526] border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={12} className="text-[#636363] flex-shrink-0" />
                <span className="text-[11px] text-[#858585] truncate">
                  {documentoSeleccionadoNombre ? `${documentoSeleccionadoNombre}` : proyectoActivo ? `${proyectoActivo.nombre} — Visor Consolidado` : "Sin documento"}
                </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={handlePaginaAnterior} disabled={paginaActual <= 1} className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] text-[#636363] hover:text-[#cccccc] disabled:opacity-30">
                <ChevronLeft size={13} />
              </button>
              <span className="text-[11px] text-[#858585] min-w-[60px] text-center">
                {paginaActual} / {totalPaginas}
              </span>
              <button onClick={handlePaginaSiguiente} disabled={paginaActual >= totalPaginas} className="p-1 rounded hover:bg-[rgba(255,255,255,0.06)] text-[#636363] hover:text-[#cccccc] disabled:opacity-30">
                <ChevronRight size={13} />
              </button>
              <div className="w-px h-3.5 bg-[rgba(255,255,255,0.08)] mx-1" />
              <button onClick={handleZoomOut} disabled={zoom <= 50} className="p-1 rounded text-[#636363] hover:text-[#cccccc]">
                <ZoomOut size={12} />
              </button>
              <button onClick={handleZoomReset} className="text-[11px] text-[#858585] px-1.5 py-0.5 rounded w-[45px] text-center">
                {zoom}%
              </button>
              <button onClick={handleZoomIn} disabled={zoom >= 200} className="p-1 rounded text-[#636363] hover:text-[#cccccc]">
                <ZoomIn size={12} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#3c3c3c] flex items-center justify-center p-6">
            {proyectoActivo ? (
              proyectoActivo.cantidadDocs > 0 ? (
                documentoSeleccionadoUrl ? (
                  <iframe 
                    src={`${documentoSeleccionadoUrl}#toolbar=0`} 
                    className="w-full h-full border-none rounded bg-white shadow-2xl" 
                  />
                ) : (
                  <div className="relative bg-white shadow-2xl flex flex-col" style={{ width: `${(595 * zoom) / 100}px`, minHeight: `${(842 * zoom) / 100}px` }}>
                     <div className="p-8 flex flex-col gap-4 flex-1 items-center justify-center text-center">
                        <FileText size={48} className="text-[#e2e2e2] mb-4" />
                        <h3 className="text-[#636363] font-medium font-sans">{proyectoActivo.cantidadDocs} Archivos Encontrados.</h3>
                        <p className="text-xs text-[#858585]">Selecciona un documento de la lista lateral para visualizar el PDF real en este espacio.</p>
                     </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center max-w-sm">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-sm font-semibold text-muted-foreground">Este proyecto no tiene documentos.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Usa el botón "Agregar PDF" para alimentar la IA.</p>
                  <button onClick={() => setModalUploadAbierto(true)} className="px-4 py-2 bg-primary rounded-md text-white text-xs font-medium hover:bg-primary/80">
                    + Subir mi primer archivo
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                  <FolderOpen size={28} className="text-[#3a3a3a]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#858585]">Selecciona un proyecto</p>
                  <p className="text-xs text-[#636363] mt-1">o crea uno nuevo para empezar a subir documentos.</p>
                </div>
                <button onClick={() => setModalNuevoProyectoAbierto(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D9E75] hover:bg-[#178f68] text-white text-xs font-medium">
                  <Upload size={13} />
                  Crear primer proyecto
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* ──────────── PANEL 3: CHAT IA ──────────────────── */}
      <div className={`transition-all duration-200 overflow-hidden flex-shrink-0 ${mostrarChat ? "w-[280px]" : "w-0"}`}>
        {loading ? (
           <div className="p-4 space-y-4 pt-10 border-l border-[rgba(255,255,255,0.06)] h-full bg-[#252526]">
              <Skeleton className="h-[22px] w-1/3 bg-[rgba(255,255,255,0.04)]" />
              <div className="space-y-2 mt-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full bg-[rgba(255,255,255,0.04)]" />)}
              </div>
           </div>
        ) : (
          <ChatPanel
            proyectoActivo={proyectoActivo}
            documentoSeleccionadoId={documentoSeleccionadoId}
          />
        )}
      </div>

      {/* ── TOGGLE BOTONES (móvil) ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:hidden z-50">
        <button onClick={() => setMostrarSidebar((v) => !v)} className="px-3 py-1.5 rounded-full bg-[#252526] border border-white/10 text-[11px] text-[#858585]">
          {mostrarSidebar ? "← Sidebar" : "Sidebar →"}
        </button>
        <button onClick={() => setMostrarChat((v) => !v)} className="px-3 py-1.5 rounded-full bg-[#252526] border border-white/10 text-[11px] text-[#858585]">
          {mostrarChat ? "Chat →" : "← Chat"}
        </button>
      </div>

      {/* ── PANEL OCR (Flota desde la derecha) ── */}
      <OCRPanel 
        isOpen={ocrAbierto} 
        onClose={() => setOcrAbierto(false)} 
        documentoId={documentoSeleccionadoId} 
        documentoNombre={documentoSeleccionadoNombre}
      />
    </div>
  );
}
