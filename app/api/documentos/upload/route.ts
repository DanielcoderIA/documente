import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación en SSR de Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión primero." }, { status: 401 });
    }

    // 2. Extraer datos del formato FormData
    const formData = await req.formData();
    const proyectoId = formData.get("proyecto_id") as string;
    const file = formData.get("file") as File | null;

    if (!proyectoId || !file) {
      return NextResponse.json({ error: "Faltan parámetros (proyecto_id o archivo)." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Sube un PDF o imagen válida." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo excede el tamaño máximo permitido (10MB)." }, { status: 400 });
    }

    const supabase = await createClient();

    // 3. Generar un path único en Storage y subir el archivo
    const fileExt = file.name.split('.').pop()?.toLowerCase() || "";
    // Se sanitiza un poco el nombre y se concatena un timestamp para evitar sobreescritura natural.
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 100);
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = `${userId}/${proyectoId}/${fileName}`;

    const { data: storageData, error: storageError } = await supabase
      .storage
      .from("documentos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (storageError) {
      console.error("Error Supabase Storage:", storageError);
      return NextResponse.json({ error: `Error subiendo archivo al bucket: ${storageError.message}` }, { status: 500 });
    }

    // Obtener la URL pública base para referencias indirectas
    const { data: { publicUrl } } = await supabase
      .storage
      .from("documentos")
      .getPublicUrl(filePath);

    // 4. Insertar la referencia en la tabla documentos
    const { data: documentoData, error: dbError } = await supabase
      .from("documentos")
      .insert({
        proyecto_id: proyectoId,
        user_id: userId,
        nombre_archivo: file.name,
        tipo: file.type === "application/pdf" ? "pdf" : "imagen", // En Sprint 5 se infiere mejor si es RUT, EPS, etc.
        tamano: file.size,
        path_storage: filePath,
        url_storage: publicUrl,
        estado: "procesando", // Listo para Langchain
        paginas: 0, 
      } as any)
      .select('id')
      .single() as { data: { id: string } | null, error: any };


    if (dbError) {
      console.error("Error BD Documentos:", dbError);
      return NextResponse.json({ error: "El archivo subió pero ocurrió un error registrando en Base de Datos." }, { status: 500 });
    }

    // Retorno exitoso
    return NextResponse.json({ 
      success: true, 
      documento_id: documentoData!.id,
      url_storage: publicUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Excepción en API upload:", error);
    return NextResponse.json({ error: "Excepción del servidor al procesar el documento." }, { status: 500 });
  }
}
