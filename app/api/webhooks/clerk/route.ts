import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // CLERK_WEBHOOK_SECRET configurado en las variables de entorno
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Agrega CLERK_WEBHOOK_SECRET en .env.local para procesar los webhooks");
  }

  // Toma los encabezados (headers) para la validación de svix
  const headersPayload = await headers();
  const svix_id = headersPayload.get("svix-id");
  const svix_timestamp = headersPayload.get("svix-timestamp");
  const svix_signature = headersPayload.get("svix-signature");

  // Si no hay headers de svix, la solicitud es inválda
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error procesando Webhook de Clerk. Faltan headers Svix.", {
      status: 400,
    });
  }

  // Captura el cuerpo plano para pasárselo a svix
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    // Verifica criptográficamente usando Svix que la petición proviene exclusivamente de Clerk.
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Fallo verificando el webhook de Clerk:", err);
    return new Response("Error al verificar la firma de Clerk", {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  // Escuchamos por eventos de "user.created" o "user.updated" para forzar sincronía
  if (eventType === "user.created" || eventType === "user.updated") {
    // Utilizamos el service_role superset admin client ya que esta operación "bypassea" RLS
    // porque ni siquiera el usuario está instanciado.
    const supabaseAdmin = createAdminClient();

    const { email_addresses, first_name, last_name, image_url } = evt.data;
    
    // Obtener email primario del usuario de Clerk
    const primaryEmail = email_addresses.length > 0 ? email_addresses[0].email_address : "";

    const fullName = [first_name, last_name].filter(Boolean).join(" ") || "Usuario Nuevo";

    // Hacer un UPSERT en la tabla profiles: Si no existe, lo creará, si existe actualizará email y avatar.
    const { error } = await supabaseAdmin.from("profiles").upsert({
      clerk_user_id: id as string,
      email: primaryEmail,
      nombre: fullName,
      avatar_url: image_url || null,
      plan: "free",
      // updated_at: new Date().toISOString()
    } as any, {
      onConflict: "clerk_user_id"
    });

    if (error) {
      console.error("Error insertando el perfil del usuario en Supabase:", error);
      return new Response("Error al registrar evento", { status: 500 });
    }
  }

  return new Response("Webhook procesado correctamente", { status: 200 });
}
