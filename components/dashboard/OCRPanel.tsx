"use client";

import { useState, useEffect } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OCRPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentoId: string | null;
  documentoNombre: string | null;
}

export function OCRPanel({ isOpen, onClose, documentoId, documentoNombre }: OCRPanelProps) {
  const [fragmentos, setFragmentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentoId) return;

    const fetchFragmentos = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      try {
        const { data, error: sbError } = await supabase
          .from("fragmentos")
          .select("pagina, contenido")
          .eq("documento_id", documentoId)
          .order("pagina", { ascending: true });

        if (sbError) throw sbError;
        setFragmentos(data || []);
      } catch (err: any) {
        console.error("Error trayendo fragmentos OCR:", err);
        setError("Error al cargar los fragmentos extraídos.");
      } finally {
        setLoading(false);
      }
    };

    fetchFragmentos();
  }, [isOpen, documentoId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Panel / Sheet */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-[#1e1e1e] border-l border-[rgba(255,255,255,0.06)] shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.06)] bg-[#252526]">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#1D9E75]">
              Extracción OCR
            </span>
            <span className="text-sm font-medium text-white truncate max-w-[280px]">
              {documentoNombre || "Documento"}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-[#858585] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#858585]">
              <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
              <p className="text-sm">Recuperando textos indexados...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          ) : fragmentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <FileText size={48} className="mb-4 text-[#858585]" />
              <p className="text-sm text-center px-6">
                Este documento no tiene fragmentos extraídos aún. Es probable que no se haya completado su procesamiento IA.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#858585]">{fragmentos.length} Fragmentos vectorizados</span>
              </div>
              {fragmentos.map((frag, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-sm bg-[#1D9E75]/20 text-[#1D9E75] text-[10px] font-bold">
                      Pag {frag.pagina}
                    </span>
                    <span className="text-[10px] text-[#636363]">Fragmento {i + 1}</span>
                  </div>
                  <p className="text-xs text-[#e8e8e8] leading-relaxed whitespace-pre-wrap font-mono">
                    {frag.contenido}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
