-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists vector;  -- habilita el tipo vector y los índices ANN


-- ============================================================
-- USERS
-- id_user = Firebase UID (string), se usa directamente para evitar
-- tener que sincronizar IDs entre Firebase y la DB
-- ============================================================
create table users (
  id_user text primary key,
  mail    text not null unique,
  f_union timestamp with time zone default now()
);


-- ============================================================
-- PROFILES
-- Cada perfil es un RAG independiente (school, civil, uba, etc.)
-- Se pueden agregar en cualquier momento sin tocar el schema
-- ============================================================
create table profiles (
  id_profile  bigserial primary key,
  name        text not null unique,    -- identificador corto, ej: 'civil'
  description text,                    -- descripción legible, ej: 'Ing. Civil - Ramiro'
  active      boolean not null default true,  -- soft delete: desactiva sin borrar datos
  doc_count   int not null default 0,  -- cache de chunks; lo mantiene el trigger automáticamente
  f_created   timestamp with time zone default now()
);


-- ============================================================
-- DOCUMENTS
-- Cada row = un chunk de texto con su embedding
-- Un archivo puede generar N chunks → N rows con el mismo id_profile
-- ============================================================
create table documents (
  id_doc     bigserial primary key,
  id_profile bigint not null references profiles(id_profile) on delete cascade,
  content    text,                          -- texto del chunk
  metadata   jsonb not null default '{}',   -- info del origen: archivo, página, tema, etc.
  embedding  vector(3072),                  -- vector generado por gemini-embedding-2 (multimodal)
  f_created  timestamp with time zone default now()
);

-- Índice B-tree: acelera el filtro WHERE id_profile = X
create index idx_documents_profile on documents(id_profile);

-- Índice HNSW para búsqueda vectorial por similitud coseno
-- Ventaja sobre IVFFlat: no necesita datos para entrenar, funciona en cualquier escala
-- m=16: balance entre memoria y calidad del grafo
-- ef_construction=64: calidad de construcción del índice
create index idx_documents_embedding on documents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);


-- ============================================================
-- TRIGGER: sincroniza doc_count en profiles
-- Se dispara en cada INSERT o DELETE en documents
-- Evita hacer COUNT(*) en runtime
-- ============================================================
create or replace function update_profile_doc_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set doc_count = doc_count + 1 where id_profile = NEW.id_profile;
  elsif TG_OP = 'DELETE' then
    update profiles set doc_count = doc_count - 1 where id_profile = OLD.id_profile;
  end if;
  return null;
end;
$$;

create trigger trg_documents_count
after insert or delete on documents
for each row execute function update_profile_doc_count();


-- ============================================================
-- FUNCIÓN: match_documents
-- Búsqueda vectorial filtrada por perfil (RAG)
--
-- Parámetros:
--   query_embedding : vector del input del usuario (generado por gemini-embedding)
--   profile_id      : RAG seleccionado desde la UI
--   match_count     : cantidad de chunks a devolver (3,5,7,9,12,15)
--   filter          : filtro opcional sobre metadata, ej: '{"file": "apunte.pdf"}'
--                     default '{}' = sin filtro
--
-- Ajuste automático de ef_search según tamaño del perfil:
--   <300 chunks  → 40  (perfiles chicos, el planner puede hacer seq scan directamente)
--   300-999      → 60  (mediano, balance velocidad/recall)
--   1000+        → 120 (perfiles grandes como civil, maximiza recall)
-- ============================================================
create or replace function match_documents(
  query_embedding vector(3072),
  profile_id      bigint,
  match_count     int   default 5,
  filter          jsonb default '{}'
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql stable as $$
declare
  total_docs int;
begin
  -- Leer doc_count cacheado; si el perfil no existe o está inactivo retorna vacío
  select doc_count into total_docs
  from profiles
  where id_profile = profile_id and active = true;

  if total_docs is null then return; end if;

  -- Tunear ef_search según escala del perfil
  if total_docs >= 1000 then
    perform set_config('hnsw.ef_search', '120', true);
  elsif total_docs >= 300 then
    perform set_config('hnsw.ef_search', '60', true);
  else
    perform set_config('hnsw.ef_search', '40', true);
  end if;

  return query
    select
      d.id_doc,
      d.content,
      d.metadata,
      1 - (d.embedding <=> query_embedding) as similarity
    from documents d
    where d.id_profile = profile_id
      and d.metadata @> filter
    order by d.embedding <=> query_embedding
    limit match_count;
end;
$$;