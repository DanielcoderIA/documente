import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter es la fuente estándar para apps colombianas profesionales
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DocuMente — Análisis Inteligente de Documentos",
    template: "%s | DocuMente",
  },
  description:
    "Sube tus PDFs colombianos (RUT, EPS, DIAN, Cámara de Comercio) y chatea con IA que entiende tu documentación. Para contadores, independientes y estudiantes.",
  keywords: ["PDF", "IA", "Colombia", "DIAN", "RUT", "análisis documentos"],
  authors: [{ name: "DocuMente" }],
  robots: "index, follow",
  openGraph: {
    title: "DocuMente — Análisis Inteligente de Documentos",
    description: "Chat con IA sobre tus documentos colombianos",
    type: "website",
    locale: "es_CO",
  },
  icons: { icon: '/icon.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ClerkProvider debe envolver toda la app para gestionar sesiones
    <ClerkProvider>
      <html lang="es" className={`${inter.variable} dark`} suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
          {/* Notificaciones toast globales */}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
