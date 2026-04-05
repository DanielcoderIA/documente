/**
 * Datos mock para el dashboard de DocuMente
 * Se reemplazarán con llamadas reales a Supabase en Sprint 4
 */
import type { ProyectoUI, MensajeChat, AccionRapida } from "@/types/app";

/** Proyectos de ejemplo para el sidebar */
export const PROYECTOS_MOCK: ProyectoUI[] = [
  {
    id: "1",
    nombre: "Renta 2025",
    color: "#1D9E75",
    cantidadDocs: 20,
    descripcion: "Declaración de renta persona natural",
    ultimaActividad: "hace 2 horas",
  },
  {
    id: "2",
    nombre: "Contrato Arriendo",
    color: "#4F8EF7",
    cantidadDocs: 3,
    descripcion: "Contrato de arrendamiento El Poblado",
    ultimaActividad: "hace 1 día",
  },
  {
    id: "3",
    nombre: "Empresa SAS",
    color: "#F59E0B",
    cantidadDocs: 8,
    descripcion: "Documentos constitución y operación",
    ultimaActividad: "hace 3 días",
  },
  {
    id: "4",
    nombre: "EPS Sura 2024",
    color: "#EF4444",
    cantidadDocs: 5,
    descripcion: "Historia clínica y autorizaciones",
    ultimaActividad: "hace 1 semana",
  },
];

/** Conversación de ejemplo en el chat IA */
export const MENSAJES_MOCK: MensajeChat[] = [
  {
    id: "m1",
    rol: "user",
    contenido: "¿Qué ingresos declaro en la renta de 2025?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "m2",
    rol: "assistant",
    contenido:
      "Según los documentos del proyecto **Renta 2025**, debes declarar:\n\n• **Ingresos laborales**: $48.600.000 (certificado de ingresos Bancolombia)\n• **Honorarios independiente**: $12.500.000 (facturas electrónicas DIAN)\n• **Rendimientos financieros**: $890.000 (extracto CDT Davivienda)\n\nTotal ingresos brutos: **$62.000.000 COP**\n\nTu RUT indica actividad económica 6201. ¿Quieres que calcule las deducciones permitidas?",
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    fragmentos: [
      { documentoNombre: "Cert_Ingresos_2025.pdf", pagina: 1, contenido: "Ingresos laborales" },
      { documentoNombre: "RUT_Actualizado.pdf", pagina: 1, contenido: "Actividad económica" },
    ],
  },
  {
    id: "m3",
    rol: "user",
    contenido: "Sí, calcula las deducciones",
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
  },
  {
    id: "m4",
    rol: "assistant",
    contenido:
      "Con base en tus documentos, las deducciones aplicables son:\n\n• **4% Dependientes**: $2.448.000\n• **Medicina prepagada**: $1.200.000\n• **Intereses hipotecarios**: No aplica (sin documento)\n\n**Base gravable estimada**: $58.352.000\n\nEsto te ubica en la tabla de tarifas del Art. 241 ET. La DIAN abre formulario 210 en abril. ¿Necesitas el resumen ejecutivo?",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
];

/** Acciones rápidas del panel IA */
export const ACCIONES_RAPIDAS: AccionRapida[] = [
  {
    id: "resumen",
    label: "Resumen ejecutivo",
    descripcion: "Puntos clave del proyecto",
    color: "#1D9E75",
    bgColor: "rgba(29,158,117,0.12)",
    prompt:
      "Dame un resumen ejecutivo con los puntos más importantes de todos los documentos de este proyecto.",
  },
  {
    id: "riesgos",
    label: "Detectar riesgos",
    descripcion: "Alertas y vencimientos",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.12)",
    prompt:
      "Identifica riesgos, fechas de vencimiento, multas posibles y alertas importantes en los documentos.",
  },
  {
    id: "acciones",
    label: "Puntos de acción",
    descripcion: "Tareas pendientes",
    color: "#4F8EF7",
    bgColor: "rgba(79,142,247,0.12)",
    prompt:
      "Lista las tareas pendientes y acciones concretas que debo tomar según los documentos del proyecto.",
  },
];
