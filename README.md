# 📄 DocuMente — Análisis Inteligente de Documentos

> **Chatea con IA que entiende tu documentación contable y legal en segundos.**

## 🤔 Problem Statement

En el contexto colombiano, contadores, trabajadores independientes y estudiantes lidian frecuentemente con una gran cantidad de documentos burocráticos (RUT, certificados EPS, declaraciones DIAN, Cámara de Comercio). El análisis manual de estos documentos es tedioso, propenso a errores y lento. **DocuMente** resuelve este problema proporcionando una plataforma basada en Inteligencia Artificial (RAG) que permite cargar estos PDFs, extraer su contenido, y realizar consultas semánticas precisas para encontrar información crítica sin tener que leer cada página de manera exhaustiva.

## 💻 Tech Stack

- **Frontend:**
  - Next.js 16.2 (App Router)
  - React 19.2
  - Tailwind CSS v4 & PostCSS
  - shadcn/ui & base-ui (Componentes modernos y accesibles)
- **Backend & AI:**
  - Next.js API Routes & Server Actions
  - LangChain (Ecosistema para IA)
  - Groq SDK (Modelo `llama-3.3-70b-versatile` para inferencia ultrarrápida)
  - Anthropic & Google Generative AI (Integraciones preparadas)
- **Base de Datos & Auth:**
  - Supabase (PostgreSQL + pgvector para embeddings)
  - Supabase Storage (Almacenamiento seguro de PDFs)
  - Clerk (Autenticación e Identidad OAuth)

## 🚀 Quick Start

Sigue estos pasos para levantar el entorno de desarrollo de DocuMente:

### 1. Clonar el repositorio
```bash
git clone <tu-repo-url>
cd documente
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto basándote en el siguiente template:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA (Groq)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DocuMente
MAX_FILE_SIZE=10485760
```

### 4. Configurar Base de Datos
Ejecuta el archivo `supabase/schema.sql` en el SQL Editor de tu proyecto en Supabase para crear las tablas (`profiles`, `proyectos`, `documentos`, `fragmentos`, etc.) y configurar la extensión `pgvector` y las políticas RLS.

### 5. Iniciar Servidor
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador y explora DocuMente.
