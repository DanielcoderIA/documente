"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, FileText, CheckCircle2, AlertTriangle, ListChecks, Sparkles } from "lucide-react";
import type { ProyectoUI, MensajeChat } from "@/types/app";
import { useChat } from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatPanelProps {
  proyectoActivo: ProyectoUI | null;
  documentoSeleccionadoId: string | null;
  /** Mensajes pre-cargados (usado en Modo Demo) */
  mensajesIniciales?: MensajeChat[];
  /** Indica si la app está en modo invitado */
  isDemo?: boolean;
}

export function ChatPanel({
  proyectoActivo,
  documentoSeleccionadoId,
  mensajesIniciales,
  isDemo = false,
}: ChatPanelProps) {
  const { messages, isLoading, error, sendMessage, sendQuickAction, setMessages } = useChat();
  const [inputValue, setInputValue] = useState("");

  // Sembrar mensajes mock al montar en modo demo
  useEffect(() => {
    if (isDemo && mensajesIniciales && mensajesIniciales.length > 0) {
      setMessages(mensajesIniciales);
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the chat
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !proyectoActivo) return;
    sendMessage(inputValue, proyectoActivo.id, documentoSeleccionadoId);
    setInputValue("");
  };

  if (!proyectoActivo) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-[rgba(255,255,255,0.06)] items-center justify-center p-6 text-center">
        <Bot size={48} className="text-[#3a3a3a] mb-4" />
        <p className="text-sm font-medium text-[#858585]">
          Abre un proyecto para chatear
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#252526] border-l border-[rgba(255,255,255,0.06)]">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[#252526] flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Bot size={16} className="text-[#1D9E75]" />
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Asistente IA
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          <p className="text-[10px] uppercase font-semibold text-[#858585] tracking-widest">
            {proyectoActivo.cantidadDocs} Documentos sincronizados
          </p>
        </div>
      </div>

      {/* ── ACCIONES RÁPIDAS ─────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.01)] flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#636363] mb-2 px-1">
          Acciones Recomendadas
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => sendQuickAction("resumen", proyectoActivo.id, documentoSeleccionadoId)}
            disabled={isLoading}
            className="flex items-center justify-between p-2 rounded-lg bg-[#1e1e1e] border border-[rgba(255,255,255,0.04)] hover:border-[#1D9E75]/30 hover:bg-[#252526] transition-all disabled:opacity-50 group text-left"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#cccccc] group-hover:text-white transition-colors">
                Resumen Ejecutivo
              </span>
              <span className="text-[10px] text-[#636363]">
                Puntos clave del documento actual
              </span>
            </div>
            <div className="p-1.5 rounded-md bg-[rgba(29,158,117,0.1)] group-hover:bg-[rgba(29,158,117,0.2)]">
              <CheckCircle2 size={12} className="text-[#1D9E75]" />
            </div>
          </button>
          
          <button
             onClick={() => sendQuickAction("riesgos", proyectoActivo.id, documentoSeleccionadoId)}
             disabled={isLoading}
             className="flex items-center justify-between p-2 rounded-lg bg-[#1e1e1e] border border-[rgba(255,255,255,0.04)] hover:border-[#F59E0B]/30 hover:bg-[#252526] transition-all disabled:opacity-50 group text-left"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#cccccc] group-hover:text-white transition-colors">
                Detectar Riesgos
              </span>
              <span className="text-[10px] text-[#636363]">
                Alertas en el archivo seleccionado
              </span>
            </div>
            <div className="p-1.5 rounded-md bg-[rgba(245,158,11,0.1)] group-hover:bg-[rgba(245,158,11,0.2)]">
              <AlertTriangle size={12} className="text-[#F59E0B]" />
            </div>
          </button>
          
          <button
             onClick={() => sendQuickAction("acciones", proyectoActivo.id, documentoSeleccionadoId)}
             disabled={isLoading}
             className="flex items-center justify-between p-2 rounded-lg bg-[#1e1e1e] border border-[rgba(255,255,255,0.04)] hover:border-[#4F8EF7]/30 hover:bg-[#252526] transition-all disabled:opacity-50 group text-left"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#cccccc] group-hover:text-white transition-colors">
                Puntos de Acción
              </span>
              <span className="text-[10px] text-[#636363]">
                Tareas según el documento actual
              </span>
            </div>
            <div className="p-1.5 rounded-md bg-[rgba(79,142,247,0.1)] group-hover:bg-[rgba(79,142,247,0.2)]">
              <ListChecks size={12} className="text-[#4F8EF7]" />
            </div>
          </button>
        </div>
      </div>

      {/* ── MENSAJES ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in-up">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] mb-4">
              <Sparkles size={20} className="text-[#1D9E75]" />
            </div>
            <p className="text-sm font-medium text-[#cccccc] mb-1">
              DocuMente Flash
            </p>
            <p className="text-xs text-[#858585] leading-relaxed">
              Analizo el documento que tienes en pantalla para darte respuestas precisas.
            </p>
          </div>
        ) : (
          messages.map((msj) => (
            <div
              key={msj.id}
              className={`flex w-full gap-3 ${
                msj.rol === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar IA */}
              {msj.rol === "assistant" && (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] flex-shrink-0 mt-1">
                  <Bot size={16} className="text-[#1D9E75]" />
                </div>
              )}

              <div
                className={`
                  flex flex-col max-w-[85%]
                  ${msj.rol === "user" ? "items-end" : "items-start"}
                `}
              >
                {/* Burbuja Principal */}
                <div
                  className={`
                    px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap font-medium shadow-sm transition-all
                    ${
                      msj.rol === "user"
                        ? "bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] text-[#cccccc] rounded-tr-sm"
                        : "bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] text-[#e8e8e8] rounded-tl-sm ring-1 ring-[rgba(29,158,117,0.05)]"
                    }
                  `}
                >
                  {msj.contenido || "Analizando contenido..."}
                </div>

                {/* Fuentes Citadas (Fragmentos si existen) */}
                {msj.fragmentos && msj.fragmentos.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2 w-full pr-4">
                    <p className="text-[9px] font-semibold text-[#636363] uppercase tracking-widest px-1">
                      Fuentes extraídas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msj.fragmentos.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] hover:bg-[#252526] transition-colors cursor-help"
                          title={f.contenido}
                        >
                          <FileText size={10} className="text-[#1D9E75]" />
                          <span className="text-[10px] text-[#858585] truncate max-w-[120px]">
                            {f.documentoNombre} (Pag {f.pagina})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Notificación de carga mientras se consulta a Gemini */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[rgba(29,158,117,0.1)] border border-[rgba(29,158,117,0.2)] flex-shrink-0 animate-pulse">
              <Bot size={16} className="text-[#1D9E75]" />
            </div>
            <div className="flex flex-col gap-1">
               <p className="text-xs text-[#858585] animate-pulse">DocuMente está analizando tus documentos...</p>
               <Skeleton className="h-4 w-[150px] bg-[rgba(255,255,255,0.05)]" />
            </div>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      {/* ── INPUT ──────────────────────────────────────────── */}
      <div className="p-4 bg-[#252526] border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
        {isDemo ? (
          /* Aviso Demo — no se envían mensajes reales */
          <div className="flex flex-col items-center gap-2 py-3 px-2 border border-[#1D9E75]/20 bg-[#1D9E75]/5">
            <p className="text-[10px] text-[#1D9E75] font-mono uppercase tracking-widest text-center">
              Chat IA activo en modo demo
            </p>
            <p className="text-[9px] text-[rgba(255,255,255,0.3)] text-center leading-relaxed">
              Crea una cuenta gratuita para analizar tus propios documentos con IA.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.08)] p-1.5 focus-within:border-[#1D9E75]/50 focus-within:ring-1 focus-within:ring-[#1D9E75]/20 transition-all shadow-inner"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || !proyectoActivo?.id}
              placeholder={isLoading ? "La IA está respondiendo..." : "Pregúntale a DocuMente sobre este caso..."}
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none text-[13px] text-white resize-none px-3 py-2.5 outline-none placeholder:text-[#636363] disabled:opacity-50"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !proyectoActivo?.id}
              className={`
                flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-lg transition-all
                ${
                  !inputValue.trim() || isLoading
                    ? "bg-[rgba(255,255,255,0.05)] text-[#636363]"
                    : "bg-[#1D9E75] hover:bg-[#178f68] text-white shadow-lg shadow-[#1D9E75]/20"
                }
              `}
            >
              <Send size={16} className={!inputValue.trim() || isLoading ? "" : "ml-0.5"} />
            </button>
          </form>
        )}
        {!isDemo && (
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[9px] text-[#636363]">
              Soporta PDFs múltiples de forma nativa vía embebido directo.
            </p>
            <p className="text-[9px] text-[#636363]">
              Enter para enviar · Shift+Enter salto de línea
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
