import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEMO_COOKIE = "documente-demo";

// Rutas que normalmente requieren sesión activa de Clerk
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/proyectos(.*)",
  "/documentos(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // ── GUEST MODE BYPASS ─────────────────────────────────────────
  // Si la cookie de demo está presente, dejamos pasar sin Clerk.
  const demoCookie = req.cookies.get(DEMO_COOKIE);
  if (demoCookie?.value === "1" && isProtectedRoute(req)) {
    return NextResponse.next();
  }
  // ─────────────────────────────────────────────────────────────

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
