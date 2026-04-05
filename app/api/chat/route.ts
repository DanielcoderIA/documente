import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";
import { generarEmbeddingLocal } from "@/lib/embeddings";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// 1. TIPOS E INTERFACES
// ─────────────────────────────────────────────

interface ChatRequestBody {
  mensaje: string;
  proyecto_id: string;
  documento_id?: string;
}

interface Fragmento {
  contenido: string;
  pagina: number;
}

interface ProyectoRow {
  id: string;
}

type FragmentoRow = Fragmento;

// ─────────────────────────────────────────────
// 2. CONSTANTES Y CONFIGURACIÓN
// ─────────────────────────────────────────────

const MAX_CONTEXT_CHARS = 12_000;
const MAX_OUTPUT_TOKENS = 2_000;
const GROQ_TEMPERATURE = 0.6;
const MAX_MENSAJE_CHARS = 4_000;

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────
// 3. CLIENTE GROQ — Lazy initialization
// ─────────────────────────────────────────────

let _groqClient: Groq | null = null;

function getGroqClient() {
  if (_groqClient) return _groqClient;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "[Config] GROQ_API_KEY no definida en .env.local",
      500
    );
  }

  _groqClient = new Groq({ apiKey });
  return _groqClient;
}

// ─────────────────────────────────────────────
// 4. ERROR PERSONALIZADO
// ─────────────────────────────────────────────

class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─────────────────────────────────────────────
// 5. HELPERS
// ─────────────────────────────────────────────

function generateRequestId(): string {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

const log = {
  info: (msg: string, meta?: object, rid?: string) =>
    console.log(`[INFO]  ${rid ? `[${rid}] ` : ""}${msg}`, meta ?? ""),
  warn: (msg: string, meta?: object, rid?: string) =>
    console.warn(`[WARN]  ${rid ? `[${rid}] ` : ""}${msg}`, meta ?? ""),
  error: (msg: string, meta?: object, rid?: string) =>
    console.error(`[ERROR] ${rid ? `[${rid}] ` : ""}${msg}`, meta ?? ""),
};

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function sanitize(input: string): string {
  return input.trim().slice(0, MAX_MENSAJE_CHARS).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

// ─────────────────────────────────────────────
// 6. SYSTEM INSTRUCTION
// ─────────────────────────────────────────────

function buildSystemInstruction(): string {
  return `Eres DocuMente, asistente experto en contabilidad y finanzas para contadores y empresarios en Colombia.

REGLAS:
- Responde siempre en español, de forma profesional y clara.
- Usa terminología colombiana: RUT, NIT, DIAN, Supersociedades, UVT, IVA, retefuente, reteica.
- Formato de moneda colombiana: $1.500.000 COP (sin decimales para valores enteros).
- Si la información no está en el contexto proporcionado, indícalo explícitamente: "No encontré esta información en el documento."
- Nunca inventes cifras, fechas ni disposiciones legales.
- Sé conciso pero completo. Usa listas cuando facilite la lectura.`;
}

// ─────────────────────────────────────────────
// 7. VALIDACIÓN DEL BODY
// ─────────────────────────────────────────────

function parseAndValidateBody(raw: unknown): ChatRequestBody {
  if (!raw || typeof raw !== "object") {
    throw new AppError("Body inválido o vacío", 400, "INVALID_BODY");
  }

  const { mensaje, proyecto_id, documento_id } = raw as Record<string, unknown>;

  if (typeof mensaje !== "string" || !mensaje.trim()) {
    throw new AppError("El campo 'mensaje' es requerido y no puede estar vacío", 400, "MISSING_MENSAJE");
  }
  if (typeof proyecto_id !== "string" || !isValidUUID(proyecto_id)) {
    throw new AppError("El campo 'proyecto_id' debe ser un UUID válido", 400, "INVALID_PROYECTO_ID");
  }
  if (documento_id !== undefined && (typeof documento_id !== "string" || !isValidUUID(documento_id))) {
    throw new AppError("El campo 'documento_id' debe ser un UUID válido", 400, "INVALID_DOCUMENTO_ID");
  }

  return {
    mensaje: sanitize(mensaje),
    proyecto_id: proyecto_id.trim(),
    documento_id: typeof documento_id === "string" ? documento_id.trim() : undefined,
  };
}

// ─────────────────────────────────────────────
// 8. AUTORIZACIÓN
// ─────────────────────────────────────────────

async function verificarAccesoProyecto(
  supabase: SupabaseClient,
  proyecto_id: string,
  userId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("proyectos")
    .select("id")
    .eq("id", proyecto_id)
    .eq("user_id", userId)
    .single<ProyectoRow>();

  if (error || !data) {
    throw new AppError("Proyecto no encontrado o sin acceso", 403, "ACCESS_DENIED");
  }
}

// ─────────────────────────────────────────────
// 9. RAG — OBTENER FRAGMENTOS (Aquí estaba el error)
// ─────────────────────────────────────────────

async function obtenerFragmentos(
  supabase: SupabaseClient,
  { mensaje, proyecto_id, documento_id }: ChatRequestBody,
  rid: string
): Promise<{ fragmentos: Fragmento[]; modoLabel: string }> {

  if (documento_id) {
    log.info("RAG: documento específico", { documento_id }, rid);

    const { data, error } = await supabase
      .from("fragmentos")
      .select("contenido, pagina")
      .eq("documento_id", documento_id)
      .order("pagina", { ascending: true });

    if (error) {
      log.warn("Supabase fragmentos error", { message: error.message, code: error.code }, rid);
    }

    return {
      fragmentos: (data as FragmentoRow[] | null) ?? [],
      modoLabel: "CONTENIDO DEL DOCUMENTO SELECCIONADO",
    };
  }

  log.info("RAG: búsqueda semántica global", { proyecto_id }, rid);

  const queryEmbedding = generarEmbeddingLocal(mensaje);

  const { data, error } = await supabase.rpc("match_fragmentos", {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 8,
    p_proyecto_id: proyecto_id,
  });

  if (error) {
    log.warn("Supabase RPC error", { message: error.message, code: error.code }, rid);
  }

  return {
    fragmentos: (data as FragmentoRow[] | null) ?? [],
    modoLabel: "CONTEXTO RELEVANTE DEL PROYECTO",
  };
}

// ─────────────────────────────────────────────
// 10. FORMATEAR CONTEXTO
// ─────────────────────────────────────────────

function formatearContexto(fragmentos: Fragmento[], modoLabel: string): string {
  if (fragmentos.length === 0) {
    return `${modoLabel}:\n\n[Sin fragmentos disponibles para esta consulta]`;
  }

  let contexto = `${modoLabel}:\n\n`;

  for (const [i, f] of fragmentos.entries()) {
    const bloque = `--- FRAGMENTO ${i + 1} (Pág. ${f.pagina}) ---\n${f.contenido}\n\n`;
    if (contexto.length + bloque.length > MAX_CONTEXT_CHARS) break;
    contexto += bloque;
  }

  return contexto.trimEnd();
}

// ─────────────────────────────────────────────
// 11. STREAM DE RESPUESTA (GROQ)
// ─────────────────────────────────────────────

function buildStreamResponse(chatCompletion: any): NextResponse {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));

      try {
        for await (const chunk of chatCompletion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) enqueue(content);
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error en stream";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

// ─────────────────────────────────────────────
// 12. HANDLER PRINCIPAL
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rid = generateRequestId();

  try {
    const { userId } = await auth();
    if (!userId) return jsonError("No autorizado", 401);

    const rawBody = await req.json();
    const body = parseAndValidateBody(rawBody); // 👈 Ya integrado de nuevo

    log.info("Chat iniciado", { proyecto: body.proyecto_id, userId }, rid);

    const supabase = await createClient();

    // 👈 Autorización reactivada
    await verificarAccesoProyecto(supabase, body.proyecto_id, userId);

    // RAG
    const { fragmentos, modoLabel } = await obtenerFragmentos(supabase, body, rid);
    const contexto = formatearContexto(fragmentos, modoLabel);

    log.info("Llamando a Groq", { model: GROQ_MODEL, fragmentos: fragmentos.length, rid });

    const client = getGroqClient();

    const responseStream = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: buildSystemInstruction() },
        { role: "user", content: `CONTEXTO:\n${contexto}\n\nPREGUNTA: ${body.mensaje}` },
      ],
      temperature: GROQ_TEMPERATURE,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
    });

    return buildStreamResponse(responseStream);

  } catch (err: unknown) {
    if (err instanceof AppError) {
      log.warn("AppError controlado", { message: err.message, status: err.statusCode, code: err.code }, rid);
      return jsonError(err.message, err.statusCode);
    }

    if (err instanceof Error && err.message.includes("429")) {
      log.warn("Groq Rate Limit alcanzado", {}, rid);
      return jsonError("El asistente está ocupado. Intenta de nuevo en unos segundos.", 429);
    }

    const message = err instanceof Error ? err.message : "Error desconocido";
    log.error("Excepción no controlada", { message }, rid);
    return jsonError("Error interno en DocuMente", 500);
  }
}