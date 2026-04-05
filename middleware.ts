import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protegemos el dashboard y las rutas bajo /dashboard, además de /proyectos y /documentos si existieran en la raíz.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/proyectos(.*)",
  "/documentos(.*)",
]);

// Clerk v5+: No declaramos las rutas públicas en el middleware de Clerk porque todo lo 
// que no pasemos por auth.protect() será público por defecto.
export default clerkMiddleware(async (auth, req) => {
  // Si la ruta coincide con el matcher de rutas protegidas, aplicamos protección.
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  // Continuamos el flujo normal (Next.js se encarga del resto)
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Se saltan archivos estáticos e internos de Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para API routes (excepto trpc si no usamos)
    '/(api|trpc)(.*)',
  ],
};
