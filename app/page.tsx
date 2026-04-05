"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Brain, ArrowRight, FileText, MessageSquare, Zap, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Landing page de DocuMente (Client Component)
 * Redirige de forma automática al dashboard si el usuario ya está autenticado.
 * Muestra el hero, características principales y llamadas a la acción (CTAs).
 */
export default function HomePage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  // Redirección cliente rápida a la app principal si detectamos sesión iniciada
  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* ── ELEMENTOS DE FONDO DECORATIVOS ─────────────────── */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-5xl flex flex-col items-center py-12 sm:py-24">
        
        {/* ── HERO SECTION ───────────────────────────────────── */}
        <div className="text-center mb-10 flex flex-col items-center gap-6 animate-fade-in-up">
          <div className="flex items-center justify-center p-4 bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/5 mb-2">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground flex flex-col gap-2">
            Entiende tus contratos.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              En segundos.
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-foreground font-medium max-w-2xl leading-relaxed mt-2">
            La inteligencia artificial para tus documentos colombianos
          </p>
          
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Procesa e interroga RUT, extractos bancarios, actas de la DIAN y Cámara de Comercio.
            Sube múltiples PDFs y encuentra respuestas exactas en segundos.
          </p>
        </div>

        {/* ── BOTONES DE ACCIÓN (CTAs) ─────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full max-w-md justify-center animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-base font-semibold shadow-lg shadow-primary/20 rounded-xl w-full sm:w-auto")}>
            Comenzar ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          
          <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-14 px-8 text-base font-semibold rounded-xl border-border bg-card/40 hover:bg-card/80 backdrop-blur-md w-full sm:w-auto")}>
            Ingresar a mi cuenta
          </Link>
        </div>

        {/* ── TARJETAS DE CARACTERÍSTICAS ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Multi-Documento RAG</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sube toda la carpeta del cliente (RUT, Certificados, Extractos). La IA conectará los puntos entre todos los archivos simultáneamente.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">OCR & Visión IA</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ¿Te enviaron una foto borrosa del RUT o un documento escaneado? DocuMente extrae campos exactos usando visión artificial.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Detección de Riesgos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El sistema marca en rojo cláusulas de permanencia tramposas, multas ocultas y tasas de usura en contratos y pagarés.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}
