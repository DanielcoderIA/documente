/**
 * Tipos compartidos de la aplicación DocuMente
 * Usados en componentes de UI (no los tipos de BD de types/database.ts)
 */

export interface DocumentoUI {
  id: string;
  nombre_archivo: string;
  tipo: string;
  estado: string;
  path_storage: string;
  url_storage?: string;
  paginas?: number;
}

/** Proyecto con datos necesarios para la UI */
export interface ProyectoUI {
  id: string;
  nombre: string;
  color: string;          // color hex del punto indicador
  cantidadDocs: number;
  documentos: DocumentoUI[];
  descripcion?: string;
  icono?: string;
  ultimaActividad?: string;
}

/** Mensaje en el chat del panel derecho */
export interface MensajeChat {
  id: string;
  rol: "user" | "assistant";
  contenido: string;
  timestamp: Date;
  fragmentos?: FragmentoCitado[];  // fuentes usadas por la IA
}

/** Fragmento de documento citado en una respuesta IA */
export interface FragmentoCitado {
  documentoNombre: string;
  pagina: number;
  contenido: string;
}

/** Acción rápida del panel de chat */
export interface AccionRapida {
  id: string;
  label: string;
  descripcion: string;
  color: string;       // color del ícono/badge
  bgColor: string;     // fondo del botón
  prompt: string;      // prompt que se envía a la IA al hacer clic
}

/** Estado del visor de PDF */
export interface EstadoPDF {
  nombreArchivo: string;
  paginaActual: number;
  totalPaginas: number;
  zoom: number;
}
