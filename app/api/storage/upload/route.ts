import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Instancia global con SERVICE_ROLE_KEY (By-pass estricto de RLS policies)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB límite
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación en SSR del token universal Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión primero." }, { status: 401 });
    }

    // 2. Extraer archivo del Formulario HTTP
    const formData = await req.formData();
    const proyectoId = formData.get("proyecto_id") as string;
    const file = formData.get("file") as File | null;

    if (!proyectoId || !file) {
      return NextResponse.json({ error: "Faltan parámetros de envío (proyecto_id o el propio File)." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato no válido. Sube PDFs o capturas legibles." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Archivo demasiado pesado. El límite permitido es 10MB." }, { status: 400 });
    }

    // 3. Crear Path único hacia el Bucket
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 100);
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = `${userId}/${proyectoId}/${fileName}`; // Estructurado por user/proyecto

    // 4. Subida Mágica sin trabas (Service Role = Bypass RLS)
    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from("documentos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (storageError) {
      console.error("[Storage Service Role] Falla subiendo archivo:", storageError);
      return NextResponse.json({ error: `Storage RLS Bypass Failed: ${storageError.message}` }, { status: 500 });
    }

    // Obtener la URL publica de Supabase
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from("documentos")
      .getPublicUrl(filePath);

    // 5. Insertar metadatos pre-extracción en tabla DB 'documentos' 
    // Como también tenemos el bypass, el insert no requiere type cast nulo de db.
    const { data: documentoData, error: dbError } = await supabaseAdmin
      .from("documentos")
      .insert({
        proyecto_id: proyectoId,
        user_id: userId,
        nombre_archivo: file.name,
        tipo: file.type === "application/pdf" ? "pdf" : "imagen",
        tamano: file.size,
        path_storage: filePath,
        url_storage: publicUrl,
        estado: "procesando", 
        paginas: 0, 
      })
      .select('id')
      .single() as any;

    if (dbError || !documentoData) {
      console.error("[Documentos Table SR Bypass] Error insertando fila DB:", dbError);
      return NextResponse.json({ error: "El archivo existe, pero falló el registro inicial." }, { status: 500 });
    }

    // 6. Retornar el ID seguro para que Langchain tome las riendas en el Front End
    return NextResponse.json({ 
      success: true, 
      documento_id: documentoData?.id,
      url_storage: publicUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Excepción en API Router Storage/Upload:", error);
    return NextResponse.json({ error: "Excepción silenciosa del servidor: " + error.message }, { status: 500 });
  }
}
