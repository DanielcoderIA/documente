import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase/client";
import type { ProyectoUI } from "@/types/app";

// Mapeos de iconos lucide permitidos o usar por defecto
export const COLORES_PERMITIDOS = [
  { hex: "#1D9E75", nombre: "Verde" },
  { hex: "#4F8EF7", nombre: "Azul" },
  { hex: "#F59E0B", nombre: "Naranja" },
  { hex: "#EC4899", nombre: "Rosa" },
  { hex: "#8B5CF6", nombre: "Morado" },
  { hex: "#EF4444", nombre: "Rojo" },
];

export interface Proyecto {
  id: string;
  user_id: string;
  nombre: string;
  color: string;
  descripcion?: string;
  icono?: string;
  document_count?: number;
}

export function useProyectos() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const supabase = useSupabaseClient(); // ← JWT de Clerk inyectado automáticamente

  const [proyectos, setProyectos] = useState<ProyectoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyectos de Supabase
  const cargarProyectos = useCallback(async () => {
    if (!isClerkLoaded) return;
    if (!user) {
      setProyectos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from("proyectos")
        .select(`
          id, 
          nombre, 
          descripcion, 
          color, 
          updated_at,
          documentos (id, nombre_archivo, tipo, estado, path_storage, url_storage)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sbError) throw sbError;

      const formateados: ProyectoUI[] = data.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        color: p.color,
        cantidadDocs: p.documentos ? p.documentos.length : 0,
        documentos: p.documentos || [],
        descripcion: p.descripcion,
        ultimaActividad: new Date(p.updated_at).toLocaleDateString("es-CO"),
      }));

      setProyectos(formateados);
    } catch (err: any) {
      console.error("Error cargando proyectos:", err);
      setError("No se pudieron cargar los proyectos. Intenta recargar la página.");
    } finally {
      setLoading(false);
    }
  }, [user, isClerkLoaded, supabase]);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Crear nuevo proyecto
  const crearProyecto = async (nombre: string, color: string, descripcion: string = ""): Promise<Proyecto | null> => {
    if (!user) throw new Error("Debes autenticarte primero para crear proyectos");

    try {
      console.log("userId al crear:", user.id);

      const payload = {
        user_id: user.id,
        nombre,
        color,
        descripcion,
        icono: "folder",
      };

      const { data, error } = await supabase
        .from("proyectos")
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;

      await cargarProyectos();
      return data as Proyecto;
    } catch (err: any) {
      console.error("Error al crear proyecto:", JSON.stringify(err, null, 2));
      throw new Error(`Error BD: ${err.message}`);
    }
  };

  // Eliminar proyecto existente
  const eliminarProyecto = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("proyectos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await cargarProyectos();
    } catch (err: any) {
      console.error("Error al eliminar proyecto:", err);
      throw new Error(`Error BD: ${err.message}`);
    }
  };

  return {
    proyectos,
    loading,
    error,
    crearProyecto,
    eliminarProyecto,
    recargarProyectos: cargarProyectos,
  };
}