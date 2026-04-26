"use client";

import { useState, useCallback, useRef } from "react";
import { UploadCloud, File, X, CheckCircle, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface UploadPDFProps {
  proyectoId: string;
  onUploadSuccess: () => void;
}

interface ArchivoEnProgreso {
  file: File;
  estado: "pendiente" | "subiendo" | "extrayendo" | "embeddings" | "listo" | "error";
  progreso: number;
  errorMsg?: string;
}

export function UploadPDF({ proyectoId, onUploadSuccess }: UploadPDFProps) {
  const [archivos, setArchivos] = useState<ArchivoEnProgreso[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACEPTADOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const procesarSeleccionados = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nuevos: ArchivoEnProgreso[] = [];
    
    Array.from(files).forEach((file) => {
      if (!ACEPTADOS.includes(file.type)) {
        toast.error(`${file.name} no es un formato válido. Usa PDF o imágenes.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} excede el límite de 10MB.`);
        return;
      }

      nuevos.push({ file, estado: "pendiente", progreso: 0 });
    });

    if (nuevos.length > 0) {
      setArchivos((prev) => [...prev, ...nuevos]);
      nuevos.forEach((a) => arrancarFlujoDatos(a));
    }
  }, [proyectoId]);

  const arrancarFlujoDatos = async (archivoProgreso: ArchivoEnProgreso) => {
    try {
      // 1. Fase de Subida a Storage
      setArchivos(prev => prev.map(a => a.file === archivoProgreso.file ? { ...a, estado: "subiendo", progreso: 20 } : a));
      
      const formData = new FormData();
      formData.append("file", archivoProgreso.file);
      formData.append("proyecto_id", proyectoId);

      const respUpload = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!respUpload.ok) {
        const errorData = await respUpload.json();
        throw new Error(errorData.error || "Fallo en la subida a Storage");
      }
      
      const { documento_id } = await respUpload.json();

      // 2. Fase de Extracción de Texto y Chunking (RAG visual update)
      setArchivos(prev => prev.map(a => a.file === archivoProgreso.file ? { ...a, estado: "extrayendo", progreso: 50 } : a));
      
      const simularEmbeddings = setTimeout(() => {
         setArchivos(prev => prev.map(a => a.file === archivoProgreso.file && a.estado === "extrayendo" ? { ...a, estado: "embeddings", progreso: 80 } : a));
      }, 3000);

      // 3. Fase de Procesamiento Vectorial y LangChain real
      const respProcesar = await fetch("/api/documentos/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento_id })
      });

      clearTimeout(simularEmbeddings);

      if (!respProcesar.ok) {
        const procData = await respProcesar.json();
        throw new Error(procData.error || "Fallo procesando el PDF en la IA");
      }

      // 4. Completado con éxito
      setArchivos(prev => prev.map(a => a.file === archivoProgreso.file ? { ...a, estado: "listo", progreso: 100 } : a));
      
      onUploadSuccess();
      toast.success(`${archivoProgreso.file.name} ha sido procesado con éxito y está vivo en la red neuronal.`);
      
    } catch (err: any) {
      setArchivos(prev => prev.map(a => a.file === archivoProgreso.file ? { ...a, estado: "error", errorMsg: err.message, progreso: 0 } : a));
      toast.error(`Error procesando ${archivoProgreso.file.name}: ${err.message}`);
    }
  };

  const quitarArchivo = (file: File) => {
    setArchivos((prev) => prev.filter(a => a.file !== file));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── DRAG & DROP ZONE ────────────────────────────────────── */}
      <div 
        className={`
          flex flex-col items-center justify-center border-2 border-dashed
          rounded-xl p-4 sm:p-8 transition-all duration-200 cursor-pointer
          ${isDragActive 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border/60 bg-black/10 hover:border-border hover:bg-black/20"
          }
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          procesarSeleccionados(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-3 bg-primary/10 rounded-full mb-3 shadow-inner">
          <UploadCloud className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Haz clic o arrastra PDFs e imágenes aquí
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-sm text-center leading-relaxed">
          La IA leerá automáticamente RUTs, extractos y actas de asamblea. (Máx 10MB)
        </p>

        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          multiple
          accept=".pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => procesarSeleccionados(e.target.files)}
        />
      </div>

      {/* ── LISTA DE ARCHIVOS ───────────────────────────────────── */}
      {archivos.length > 0 && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {archivos.map((a, i) => (
            <div key={i} className="relative overflow-hidden flex items-center justify-between p-2.5 rounded-lg border border-border/20 bg-card/50">
              
              {/* Barra de progreso de fondo discreta */}
              {(a.estado === "subiendo" || a.estado === "extrayendo" || a.estado === "embeddings") && (
                <div 
                  className="absolute bottom-0 left-0 h-0.5 bg-primary/50 transition-all duration-500 ease-in-out" 
                  style={{ width: `${a.progreso}%` }} 
                />
              )}

              <div className="flex items-center gap-3 min-w-0 z-10">
                <File className={`w-5 h-5 flex-shrink-0 ${a.estado === 'error' ? 'text-destructive' : 'text-primary'}`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px]">
                    {a.file.name}
                  </span>
                  
                  {/* Etiqueta dinámica de estado IA */}
                  <span className={`text-[10px] font-medium transition-colors ${
                      a.estado === 'error' ? 'text-destructive' :
                      a.estado === 'listo' ? 'text-emerald-500' :
                      'text-primary/80 animate-pulse'
                    }`}>
                    {a.estado === "pendiente" && "Pendiente..."}
                    {a.estado === "subiendo" && "Subiendo archivo..."}
                    {a.estado === "extrayendo" && "OCR y Extracción de texto..."}
                    {a.estado === "embeddings" && "Generando Embeddings RAG..."}
                    {a.estado === "listo" && "¡Listo para chatear! ✓"}
                    {a.estado === "error" && (a.errorMsg || "Fallo crítico al procesarlo")}
                  </span>
                </div>
              </div>

              {/* Botones de acción derecha */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2 z-10">
                {(a.estado === "subiendo" || a.estado === "extrayendo" || a.estado === "embeddings") && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
                {a.estado === "listo" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {a.estado === "error" && <AlertTriangle className="w-4 h-4 text-destructive" />}

                {(a.estado === "listo" || a.estado === "error") && (
                  <button 
                    onClick={() => quitarArchivo(a.file)}
                    className="p-1.5 hover:bg-black/20 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
