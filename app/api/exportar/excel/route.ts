import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import * as xlsx from "xlsx";

/**
 * API para exportar datos del proyecto a Excel.
 * Incluye hojas de Resumen, Documentos y Fragmentos con joins y limpieza de datos.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener proyecto_id por parámetro query
    const proyecto_id = req.nextUrl.searchParams.get("proyecto_id");

    if (!proyecto_id) {
      return NextResponse.json({ error: "Falta proyecto_id válido" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Obtener datos del Proyecto (Nombre)
    const { data: proyecto, error: errorProj } = await (supabase as any)
      .from("proyectos")
      .select("nombre")
      .eq("id", proyecto_id)
      .single();

    if (errorProj) {
      console.error("[Export API] Error al obtener proyecto:", errorProj);
    }

    // 2. Obtener la lista de Documentos del proyecto y usuario
    const { data: documentos, error: errorDocs } = await (supabase as any)
      .from("documentos")
      .select("*")
      .eq("proyecto_id", proyecto_id)
      .eq("user_id", userId);

    if (errorDocs) {
      console.error("[Export API] Error al obtener documentos:", errorDocs);
      return NextResponse.json({ error: "Error al obtener los documentos" }, { status: 500 });
    }

    if (!documentos || documentos.length === 0) {
      return NextResponse.json({ error: "No se encontraron documentos para exportar" }, { status: 404 });
    }

    const docIds = documentos.map((doc: any) => doc.id);

    // 3. Obtener Fragmentos con JOIN a documentos para el nombre del archivo
    const { data: fragmentos, error: errorFrags } = await (supabase as any)
      .from("fragmentos")
      .select("id, documento_id, contenido, pagina, created_at, documentos(nombre_archivo)")
      .in("documento_id", docIds);

    if (errorFrags) {
      console.error("[Export API] Error al obtener fragmentos:", errorFrags);
      return NextResponse.json({ error: "Error al obtener los fragmentos" }, { status: 500 });
    }

    // 4. Preparar Hoja "Resumen"
    const totalPaginas = documentos.reduce((sum: number, doc: any) => sum + (doc.paginas || 0), 0);
    const resumenData = [
      ["Métrica", "Valor"],
      ["Nombre del Proyecto", proyecto?.nombre || "N/A"],
      ["Fecha de Exportación", new Date().toLocaleString("es-ES")],
      ["Total Documentos", documentos.length],
      ["Total Fragmentos", fragmentos?.length || 0],
      ["Total Páginas", totalPaginas]
    ];

    // 5. Preparar Hoja "Documentos"
    const documentosRows = documentos.map((doc: any) => ({
      "Nombre Archivo": doc.nombre_archivo,
      "Tipo": doc.tipo,
      "Estado": doc.estado,
      "Páginas": doc.paginas,
      "Fecha Subida": doc.created_at ? new Date(doc.created_at).toLocaleDateString("es-ES") : "N/A",
      "Tamaño (KB)": doc.tamano ? Math.round(doc.tamano / 1024) : 0
    }));

    // 6. Preparar Hoja "Fragmentos"
    const fragmentosRows = (fragmentos || []).map((frag: any) => ({
      "ID": frag.id,
      "Nombre Archivo": frag.documentos?.nombre_archivo || "Desconocido",
      "Contenido": frag.contenido ? frag.contenido.substring(0, 300) : "",
      "Página": frag.pagina,
      "Fecha Creación": frag.created_at ? new Date(frag.created_at).toLocaleString("es-ES") : "N/A"
    }));

    // 7. Crear Workbook y Hojas
    const workbook = xlsx.utils.book_new();

    const wsResumen = xlsx.utils.aoa_to_sheet(resumenData);
    xlsx.utils.book_append_sheet(workbook, wsResumen, "Resumen");

    const wsDocumentos = xlsx.utils.json_to_sheet(documentosRows);
    xlsx.utils.book_append_sheet(workbook, wsDocumentos, "Documentos");

    const wsFragmentos = xlsx.utils.json_to_sheet(fragmentosRows);
    xlsx.utils.book_append_sheet(workbook, wsFragmentos, "Fragmentos");

    // Generar Buffer
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 8. Retornar archivo
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Reporte_Proyecto_${proyecto?.nombre || "DocuMente"}.xlsx`
      }
    });

  } catch (error: any) {
    console.error("[Export API] Excepción al generar el archivo Excel:", error);
    return NextResponse.json({ error: "Fallo inesperado al exportar la data." }, { status: 500 });
  }
}
