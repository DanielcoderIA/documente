"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Folder, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COLORES_PREDEFINIDOS = [
  { hex: "#1D9E75", bg: "bg-emerald-500", name: "Verde DocuMente" },
  { hex: "#4F8EF7", bg: "bg-blue-500", name: "Azul" },
  { hex: "#F59E0B", bg: "bg-amber-500", name: "Naranja" },
  { hex: "#EC4899", bg: "bg-pink-500", name: "Rosa" },
  { hex: "#8B5CF6", bg: "bg-purple-500", name: "Morado" },
  { hex: "#EF4444", bg: "bg-red-500", name: "Rojo" },
];

export interface ModalNuevoProyectoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (nombre: string, color: string, descripcion: string) => Promise<any>;
}

export function ModalNuevoProyecto({ open, onOpenChange, onGuardar }: ModalNuevoProyectoProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [colorSeleccionado, setColorSeleccionado] = useState(COLORES_PREDEFINIDOS[0].hex);
  const [cargando, setCargando] = useState(false);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;

    setCargando(true);
    try {
      await onGuardar(nombre.trim(), colorSeleccionado, descripcion.trim());
      toast.success(`Proyecto "${nombre.trim()}" creado correctamente.`);
      
      // Limpiar y cerrar
      setNombre("");
      setDescripcion("");
      setColorSeleccionado(COLORES_PREDEFINIDOS[0].hex);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el proyecto");
    } finally {
      setCargando(false);
    }
  }

  // Interceptar el cerrado natural si está cargando para evitar bloqueos extraños
  function handleOpenChange(newOpen: boolean) {
    if (cargando) return;
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card text-foreground border-border/20 shadow-xl max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Folder size={16} className="text-primary" />
            </div>
            <DialogTitle className="text-xl font-semibold">Nuevo Proyecto</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Agrupa tus documentos por caso, tipo (ej. "Renta 2025") o empresa.
          </DialogDescription>
        </DialogHeader>

        <form id="form-nuevo-proyecto" onSubmit={handleGuardar} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre del proyecto</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Declaración de Renta 2024"
              className="bg-black/20 border-border/20 focus-visible:ring-primary h-10 px-3 text-sm placeholder:text-muted-foreground"
              disabled={cargando}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Documentos sobre ingresos y retenciones..."
              className="bg-black/20 border-border/20 focus-visible:ring-primary min-h-[80px] px-3 py-2 text-sm placeholder:text-muted-foreground resize-none"
              disabled={cargando}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color identificador</Label>
            <div className="flex items-center gap-3 pt-1 border border-border/10 bg-black/10 px-3 py-2.5 rounded-md">
              {COLORES_PREDEFINIDOS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  title={color.name}
                  onClick={() => setColorSeleccionado(color.hex)}
                  className={`
                    w-6 h-6 rounded-full transition-transform outline-none
                    ${color.bg}
                    ${colorSeleccionado === color.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110 shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-105'}
                  `}
                  disabled={cargando}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={cargando}
              className="text-muted-foreground border-border/20 bg-transparent hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!nombre.trim() || cargando}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {cargando ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Proyecto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
