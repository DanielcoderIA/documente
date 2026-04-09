# 🏛️ DocuMente Architecture & Flow

## 📌 Overview

DocuMente se basa en una arquitectura **Serverless** orientada a servicios y sigue un patrón de diseño híbrido que aprovecha **Next.js App Router** (React Server Components + Server Actions/API Routes). El sistema utiliza el principio de **RAG (Retrieval-Augmented Generation)** para permitir la interacción dinámica entre grandes corpus de texto documental (PDFs) y modelos de lenguaje de gran escala (LLMs).

La interfaz gráfica sigue una metodología orientada a **Atomic Design Modificado**, con componentes modulares reusables gestionados por `shadcn/ui` y lógicas específicas contenidas en dominios bajo la carpeta `components/` (ej: `chat`, `dashboard`, `proyectos`, `upload`).

## 🔄 Data Flow

El flujo principal de ingesta y consulta de documentos se divide en dos fases:

### Fase 1: Ingesta de Documentos
1. **Cliente:** El usuario autenticado sube un documento (PDF, imagen) a través de la UI (Frontend).
2. **Storage:** El archivo es validado (límite de 10MB) y guardado en **Supabase Storage** (bucket `documentos`).
3. **Database (Metadatos):** Se crea un registro en la tabla `documentos` asociado a un `proyecto_id` lógico y asegurado mediante RLS (Row Level Security).
4. **Procesamiento:**
   - Una API/Server Action descarga el archivo y utiliza utilidades locales (`pdf-parse`) para extraer el texto crudo.
   - **LangChain TextsSplitters** divide el texto en `fragmentos` (chunks de aproximadamente 500 tokens).
5. **Vectorización:** Cada fragmento es procesado para generar un **embedding vectorial** (1536 dimensiones) y se almacena centralizadamente en la tabla `fragmentos` a través de la extensión `pgvector`.

### Fase 2: Chat y Recuperación Semántica (RAG)
1. **Consulta:** El usuario escribe una pregunta en la interfaz de chat (ej. "¿Cuál es la actividad económica principal según este RUT?").
2. **Embedding Híbrido:** El backend vectoriza la pregunta del usuario utilizando un modelo de embeddings preparado.
3. **Búsqueda Vectorial:** Se invoca la función RPC `match_fragmentos` en Supabase SQL, aplicando similitud coseno para encontrar los Top-K fragmentos más relevantes, ordenados por proximidad y filtrados proactivamente mediante el `user_id` del usuario (Clerk).
4. **Prompt Building & LLM:** El backend construye un contexto sólido e inytecta los fragmentos recuperados, y realiza la petición a la capa de IA (vía Groq con modelo `llama-3.3-70b-versatile`).
5. **Stream:** La respuesta es servida de forma reactiva de regreso al cliente mientras los IDs de los fragmentos usados se archivan en la tabla `mensajes` para trazabilidad.

## 🧱 Core Components

- **`app/(dashboard)`:** Capa de enrutamiento y layout seguro. Contiene las vistas maestras de documentos, proyectos y la interfaz contextual de RAG.
- **`components/`:** Agrupa lógicas UI en dominios o features principales:
  - `upload/`: Componentes Dropzone y pipeline visual asíncrono para ingesta de archivos.
  - `chat/`: Interfaz para la ventana de conversación y visualización de payloads en tiempo real.
  - `proyectos/` & `documentos/`: Vistas de listas, tablas o grillas para organizar colecciones de conocimiento.
- **`lib/supabase/`:** Adaptadores modulares para instanciar clientes de conectividad con la DB basados en Server y Client sides (`@supabase/ssr`).
- **`app/api/`:** Funciones de enrutamiento web serverless que manejan endpoints estratégicos de negocio como `chat`, `upload`, `exportar`, y validación o sincronía para el sistema general.

---

## 🔌 API & Integrations

DocuMente se apoya en plataformas de terceros a través de Webhooks, Request REST y SDKs nativos:

### Endpoints Internos Críticos
- **`POST /api/upload`**: Gestiona la transferencia segura al storage, la segmentación textual en fragmentos y su derivación para embeddings vectoriales de los documentos cargados.
- **`POST /api/chat`**: Punto de acceso a la capa inteligente (LangChain). Entiende el contexto temporal y solicita información procesada. Expone el stream.
- **`GET/POST /api/exportar`**: Facilita la descarga de resúmenes de datos exportándolos hacia Microsoft Excel utilizando `xlsx`.

### Integraciones Externas
1. **Clerk (Auth & Identity Management)**
   - **Manejo:** SDK completo, Middleware de protección en frontend y validación JWT.
   - **Sincronización:** A través del endpoint webhooks en **`POST /api/webhooks/clerk`**, escuchando eventos criptográficamente validados mediante `svix` para mantener la data del perfil (incluyendo cobro futuro) al día en la base de PostgreSQL (`perfiles`).
2. **Supabase (Backend as a Service & Database)**
   - Interacción relacional con las tablas y ejecución RLS sobre toda la sesión.
   - Uso intensivo de extensiones embebidas post-relacionales (pgvector y RPC functions `match_fragmentos`).
3. **Groq Platform (LLM/Inference)**
   - Plataforma para ejecutar las operaciones cognitivas a ultra velocidad con modelos ligeros de estado de arte, sirviendo de núcleo para el chat contextual a través del conector correspondiente de LangChain y su SDK.

---
> **Roadmap Tecnológico Observado / Futuras Extensiones:**
> * Integrar jobs de segundo plano (cron/queues) para archivos inusualmente pesados sin depender del timeout actual asignado a Server Actions o Serverless APIs.
> * Habilitación transaccional sobre la variable `plan` y el contador `documentos_mes` detectados en el esquema de base de datos para Stripe/pasarelas locales (ej. MercadoPago / Wompi) a medida que crezca el perfil y se convierta en SaaS completo.
