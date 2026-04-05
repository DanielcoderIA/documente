import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generarEmbeddingLocal } from "@/lib/embeddings";
import pdfParse from "pdf-parse";

// ──────────────────────────────────────────────────────────── 
// 1. CONFIGURACIÓN DE IA OCR
// ──────────────────────────────────────────────────────────── 

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ──────────────────────────────────────────────────────────── 
// 2. UTILIDADES LOCALES Puras
// ──────────────────────────────────────────────────────────── 

/**
 * Función que divide un texto en pequeños trozos basándose en 
 * saltos de espacios naturales sin recurrir a paquetes grandes.
 */
function dividirEnChunks(texto: string, tamano: number = 500): string[] {
  const palabras = texto.split(" ");
  const chunks: string[] = [];
  let chunk = "";
  
  for (const palabra of palabras) {
    if ((chunk + " " + palabra).length > tamano) {
      if (chunk) chunks.push(chunk.trim());
      chunk = palabra;
    } else {
      chunk += " " + palabra;
    }
  }
  
  if (chunk) chunks.push(chunk.trim());
  return chunks.filter(c => c.length > 20); // Filtramos ruido muy pequeño
}

// ──────────────────────────────────────────────────────────── 
// 3. FUNCIÓN PRINCIPAL DE PROCESAMIENTO
// ──────────────────────────────────────────────────────────── 

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { documento_id } = await req.json();
    if (!documento_id) {
      return NextResponse.json({ error: "No se proporcionó el documento_id" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Obtener registro del documento
    const { data: doc, error: docError } = await supabase
      .from("documentos")
      .select("*")
      .eq("id", documento_id)
      .eq("user_id", userId)
      .single() as { data: { id: string; estado: string; path_storage: string; tipo: string; paginas: number; nombre_archivo: string } | null, error: any };

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento no encontrado o sin permisos" }, { status: 404 });
    }

    // Si ya está procesado, abortar
    if (doc.estado === "listo") {
      return NextResponse.json({ success: true, message: "El documento ya fue procesado." });
    }

    // 2. Descargar el archivo del Storage
    const { data: fileBlob, error: downloadError } = await (supabase as any)
      .storage
      .from("documentos")
      .download(doc.path_storage);

    if (downloadError || !fileBlob) {
      await (supabase as any).from("documentos").update({ estado: "error" }).eq("id", documento_id);
      return NextResponse.json({ error: "No se pudo descargar el archivo de Supabase Storage" }, { status: 500 });
    }

    let textoExtraido = "";
    let paginas: { contenido: string; numero: number }[] = [];

    // 3. Extracción de Texto (PDF o Imagen)
    if (doc.tipo === "pdf" || doc.path_storage.endsWith(".pdf")) {
      // Usamos el parser local directo en vez de LangChain
      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      
      const textoPorPagina = pdfData.text;
      
      // pdf-parse junta todo el texto en uno solo
      paginas.push({ contenido: textoPorPagina, numero: 1 });
      textoExtraido = textoPorPagina;
      
    } else {
      // Imagen (JPG, PNG, WEBP) -> OCR con Gemini Vision
      const arrayBuffer = await fileBlob.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString('base64');
      
      const prompt = "Extrae todo el texto de esta imagen preservando la estructura, tablas y números de forma exacta. Si es un comprobante de pago electrónico, documento de identidad (RUT/Cédula) o certificado, obtén cada dato de manera precisa. Solo responde el texto extraído sin explicaciones adicionales.";
      
      const result = await visionModel.generateContent([
        prompt,
        {
          inlineData: {
            data: base64String,
            mimeType: fileBlob.type || "image/jpeg"
          }
        }
      ]);
      
      const textoBase = result.response.text();
      paginas.push({
        contenido: textoBase,
        numero: 1
      });
      textoExtraido = textoBase;
    }

    // Lanza error si el OCR o PDF están vacíos
    if (!textoExtraido || textoExtraido.trim().length === 0) {
      await (supabase as any).from("documentos").update({ estado: "error" }).eq("id", documento_id);
      return NextResponse.json({ error: "El documento está vacío o es ilegible" }, { status: 422 });
    }

    // 4. Chunking Nativo Pura Cadena (Reemplazo sin Langchain)
    const todosLosFragmentos = [];

    // Emparejar página con su set de chunks generados localmente
    for (const pag of paginas) {
      const chunks = dividirEnChunks(pag.contenido, 500);
      for (const chunk of chunks) {
        todosLosFragmentos.push({
          contenido: chunk,
          pagina: pag.numero
        });
      }
    }

    // 5. Embedding Local Puro JS y Guardado Vectorial (Tensor de 384 dimensiones)
    for (const fragmento of todosLosFragmentos) {
      // Generamos el Vector Off-grid usando nuestra función hash nativa JS  
      const vector = generarEmbeddingLocal(fragmento.contenido);

      const { error: insertError } = await (supabase as any)
        .from("fragmentos")
        .insert({
          documento_id: documento_id,
          user_id: userId,
          contenido: fragmento.contenido,
          pagina: fragmento.pagina,
          embedding: vector
        });

      if (insertError) {
        console.error("Error insertando fragmento vectorial:", insertError);
      }
    }

    // 6. Completado: Actualizar estado y metadatos del documento DB
    await (supabase as any)
      .from("documentos")
      .update({ 
        estado: "listo", 
        paginas: paginas.length 
      })
      .eq("id", documento_id);

    return NextResponse.json({ success: true, chunks: todosLosFragmentos.length }, { status: 200 });

  } catch (error: any) {
    console.error("Excepción en API procesar:", error);
    return NextResponse.json({ error: "Fallo inesperado al procesar RAG: " + error.message }, { status: 500 });
  }
}
