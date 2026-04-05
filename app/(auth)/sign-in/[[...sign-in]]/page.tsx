import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    // Centrado en pantalla con fondo degradado oscuro de DocuMente
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#1e1b4b]">
      <div className="flex flex-col items-center gap-6">
        {/* Logo y nombre de la app */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Docu<span className="text-[#1D9E75]">Mente</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Análisis inteligente de documentos
          </p>
        </div>

        {/* Componente oficial de Clerk configurado en modo enrutamiento catch-all */}
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-[#1D9E75] hover:bg-[#178f68] text-white text-sm shadow-md",
              card: "bg-[#1e1e1e] border border-[rgba(255,255,255,0.1)] shadow-2xl rounded-xl",
              headerTitle: "text-white",
              headerSubtitle: "text-[#858585]",
              socialButtonsBlockButton:
                "border border-[rgba(255,255,255,0.1)] text-[#cccccc] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]",
              socialButtonsBlockButtonArrow: "text-white",
              socialButtonsBlockButtonText: "font-medium",
              formFieldInput:
                "bg-black/20 border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#3a3a3a] focus:ring-[#1D9E75]",
              formFieldLabel: "text-[#cccccc]",
              footerActionLink: "text-[#1D9E75] hover:text-[#178f68] font-medium",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-[#1D9E75]",
              dividerLine: "bg-[rgba(255,255,255,0.1)]",
              dividerText: "text-[#636363]",
            },
          }}
        />
      </div>
    </main>
  );
}
