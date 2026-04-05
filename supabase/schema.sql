-- ============================================================
-- DocuMente — Schema completo de base de datos
-- Ejecutar en Supabase SQL Editor de arriba hacia abajo
-- ============================================================

-- 1. Habilitar extensión pgvector para embeddings semánticos
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLA: profiles
-- Sincronizada con Clerk mediante webhook
-- Almacena datos del usuario colombiano
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT UNIQUE NOT NULL,       -- ID único de Clerk
  email           TEXT NOT NULL,
  nombre          TEXT,
  avatar_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'free', -- 'free' o 'pro'
  documentos_mes  INTEGER NOT NULL DEFAULT 0,  -- contador mensual
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: proyectos
-- Carpetas lógicas donde el usuario agrupa documentos
-- Ejemplo: "Declaración de renta 2024", "Clientes EPS"
-- ============================================================
CREATE TABLE IF NOT EXISTS proyectos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,                  -- clerk_user_id del dueño
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  color       TEXT NOT NULL DEFAULT '#6366f1', -- color hex del proyecto
  icono       TEXT NOT NULL DEFAULT 'folder',  -- nombre de icono lucide
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: documentos
-- Cada PDF o imagen subida por el usuario
-- Tipos: RUT, EPS, DIAN, cuenta_cobro, camara_comercio, otro
-- ============================================================
CREATE TABLE IF NOT EXISTS documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id     UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,              -- clerk_user_id del dueño
  nombre_archivo  TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'otro', -- 'rut','eps','dian','cuenta_cobro','camara_comercio','otro'
  tamano          BIGINT NOT NULL DEFAULT 0,  -- tamaño en bytes
  paginas         INTEGER NOT NULL DEFAULT 0,
  url_storage     TEXT,                       -- URL pública en Supabase Storage
  path_storage    TEXT,                       -- path interno en el bucket
  estado          TEXT NOT NULL DEFAULT 'procesando', -- 'procesando','listo','error'
  error_msg       TEXT,                       -- mensaje si estado='error'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: fragmentos
-- Chunks de texto extraídos de cada documento con su embedding
-- Cada fragmento tiene ~500 tokens de contenido
-- ============================================================
CREATE TABLE IF NOT EXISTS fragmentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,                -- clerk_user_id (para filtros rápidos)
  contenido    TEXT NOT NULL,               -- texto del fragmento
  embedding    vector(1536),               -- embedding OpenAI/Anthropic 1536 dims
  pagina       INTEGER NOT NULL DEFAULT 1, -- página del PDF origen
  orden        INTEGER NOT NULL DEFAULT 0, -- posición en el documento
  metadatos    JSONB NOT NULL DEFAULT '{}', -- datos extra (NIT, fecha, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: conversaciones
-- Historial de chats por proyecto
-- ============================================================
CREATE TABLE IF NOT EXISTS conversaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  titulo      TEXT NOT NULL DEFAULT 'Nueva conversación',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: mensajes
-- Mensajes individuales de cada conversación
-- ============================================================
CREATE TABLE IF NOT EXISTS mensajes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id   UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  rol               TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  contenido         TEXT NOT NULL,
  fragmentos_usados JSONB DEFAULT '[]', -- IDs de fragmentos citados por la IA
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id      ON proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_user_id     ON documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_proyecto_id ON documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_fragmentos_documento_id ON fragmentos(documento_id);
CREATE INDEX IF NOT EXISTS idx_fragmentos_user_id     ON fragmentos(user_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_proyecto ON conversaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion  ON mensajes(conversacion_id);

-- Índice IVFFlat para búsquedas vectoriales rápidas
CREATE INDEX IF NOT EXISTS idx_fragmentos_embedding
  ON fragmentos USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- FUNCIÓN: match_fragmentos
-- Búsqueda semántica por similitud coseno, filtrada por user_id
-- Usada por LangChain para RAG (Retrieval-Augmented Generation)
-- ============================================================
CREATE OR REPLACE FUNCTION match_fragmentos(
  query_embedding   vector(1536),
  match_threshold   float     DEFAULT 0.7,
  match_count       int       DEFAULT 10,
  p_user_id         text      DEFAULT '',
  p_proyecto_id     uuid      DEFAULT NULL
)
RETURNS TABLE (
  id           uuid,
  documento_id uuid,
  contenido    text,
  pagina       int,
  metadatos    jsonb,
  similarity   float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.documento_id,
    f.contenido,
    f.pagina,
    f.metadatos,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM fragmentos f
  JOIN documentos d ON d.id = f.documento_id
  WHERE
    f.user_id = p_user_id
    AND (p_proyecto_id IS NULL OR d.proyecto_id = p_proyecto_id)
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve y modifica SUS propios datos
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragmentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes         ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuario ve su propio perfil"
  ON profiles FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario actualiza su propio perfil"
  ON profiles FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Políticas para proyectos
CREATE POLICY "Usuario ve sus proyectos"
  ON proyectos FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario crea sus proyectos"
  ON proyectos FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario actualiza sus proyectos"
  ON proyectos FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario borra sus proyectos"
  ON proyectos FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Políticas para documentos
CREATE POLICY "Usuario ve sus documentos"
  ON documentos FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario crea sus documentos"
  ON documentos FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario actualiza sus documentos"
  ON documentos FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario borra sus documentos"
  ON documentos FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Políticas para fragmentos
CREATE POLICY "Usuario ve sus fragmentos"
  ON fragmentos FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario crea sus fragmentos"
  ON fragmentos FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario borra sus fragmentos"
  ON fragmentos FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Políticas para conversaciones
CREATE POLICY "Usuario ve sus conversaciones"
  ON conversaciones FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario crea sus conversaciones"
  ON conversaciones FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario actualiza sus conversaciones"
  ON conversaciones FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Usuario borra sus conversaciones"
  ON conversaciones FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Políticas para mensajes (heredan seguridad de conversaciones)
CREATE POLICY "Usuario ve sus mensajes"
  ON mensajes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = conversacion_id
        AND c.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Usuario crea sus mensajes"
  ON mensajes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = conversacion_id
        AND c.user_id = auth.jwt() ->> 'sub'
    )
  );

-- ============================================================
-- STORAGE: Bucket para PDFs
-- Ejecutar también en Supabase → Storage → New Bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  10485760,  -- 10 MB máximo
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: solo el dueño accede a sus archivos
CREATE POLICY "Usuario sube sus archivos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.jwt() ->> 'sub' IS NOT NULL
  );

CREATE POLICY "Usuario ve sus archivos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Usuario borra sus archivos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );
