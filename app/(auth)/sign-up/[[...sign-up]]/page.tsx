import { SignUp } from "@clerk/nextjs";
import { DemoButton } from "@/components/auth/DemoButton";

export default function SignUpPage() {
  return (
    // Mismo fondo degradado que sign-in para consistencia visual
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#1e1b4b] py-12 px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-[400px]">
        {/* Logo y bienvenida */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Docu<span className="text-[#1D9E75]">Mente</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Crea tu cuenta gratuita — sin tarjeta de crédito
          </p>
        </div>

        <div className="w-full flex flex-col gap-6">
          {/* Botón de acceso directo para Modo Demo */}
          <DemoButton />

          {/* Separador Visual */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(255,255,255,0.1)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0b101e] px-3 tracking-wider text-[#636363] font-medium rounded-full">
                o completa tus datos
              </span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            {/* Componente oficial de Clerk configurado para atrapar rutas */}
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
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
        </div>
      </div>
    </main>
  );
}
