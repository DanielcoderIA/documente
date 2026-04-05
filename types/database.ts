/**
 * Tipos TypeScript generados manualmente para la base de datos de DocuMente
 * Refleja exactamente el schema de supabase/schema.sql
 * Cuando uses el CLI de Supabase puedes regenerarlos con:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          nombre: string | null;
          avatar_url: string | null;
          plan: "free" | "pro";
          documentos_mes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          nombre?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro";
          documentos_mes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      proyectos: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          descripcion: string | null;
          color: string;
          icono: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          descripcion?: string | null;
          color?: string;
          icono?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["proyectos"]["Insert"]>;
      };
      documentos: {
        Row: {
          id: string;
          proyecto_id: string | null;
          user_id: string;
          nombre_archivo: string;
          tipo: TipoDocumento;
          tamano: number;
          paginas: number;
          url_storage: string | null;
          path_storage: string | null;
          estado: EstadoDocumento;
          error_msg: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id?: string | null;
          user_id: string;
          nombre_archivo: string;
          tipo?: TipoDocumento;
          tamano?: number;
          paginas?: number;
          url_storage?: string | null;
          path_storage?: string | null;
          estado?: EstadoDocumento;
          error_msg?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos"]["Insert"]>;
      };
      fragmentos: {
        Row: {
          id: string;
          documento_id: string;
          user_id: string;
          contenido: string;
          embedding: number[] | null;
          pagina: number;
          orden: number;
          metadatos: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          documento_id: string;
          user_id: string;
          contenido: string;
          embedding?: number[] | null;
          pagina?: number;
          orden?: number;
          metadatos?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fragmentos"]["Insert"]>;
      };
      conversaciones: {
        Row: {
          id: string;
          proyecto_id: string;
          user_id: string;
          titulo: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          user_id: string;
          titulo?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversaciones"]["Insert"]>;
      };
      mensajes: {
        Row: {
          id: string;
          conversacion_id: string;
          rol: "user" | "assistant";
          contenido: string;
          fragmentos_usados: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversacion_id: string;
          rol: "user" | "assistant";
          contenido: string;
          fragmentos_usados?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mensajes"]["Insert"]>;
      };
    };
    Functions: {
      match_fragmentos: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          p_user_id?: string;
          p_proyecto_id?: string | null;
        };
        Returns: {
          id: string;
          documento_id: string;
          contenido: string;
          pagina: number;
          metadatos: Json;
          similarity: number;
        }[];
      };
    };
  };
};

// ============================================================
// Tipos de dominio — usados en toda la app
// ============================================================

/** Tipos de documentos colombianos soportados */
export type TipoDocumento =
  | "rut"
  | "eps"
  | "dian"
  | "cuenta_cobro"
  | "camara_comercio"
  | "contrato"
  | "factura"
  | "nomina"
  | "otro";

/** Estado del procesamiento de un documento */
export type EstadoDocumento = "procesando" | "listo" | "error";

/** Plan del usuario */
export type PlanUsuario = "free" | "pro";

// Alias cortos para las filas de cada tabla
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
export type Documento = Database["public"]["Tables"]["documentos"]["Row"];
export type Fragmento = Database["public"]["Tables"]["fragmentos"]["Row"];
export type Conversacion = Database["public"]["Tables"]["conversaciones"]["Row"];
export type Mensaje = Database["public"]["Tables"]["mensajes"]["Row"];

// Tipo para resultados de búsqueda semántica
export type FragmentoSimilar = {
  id: string;
  documento_id: string;
  contenido: string;
  pagina: number;
  metadatos: Json;
  similarity: number;
};
