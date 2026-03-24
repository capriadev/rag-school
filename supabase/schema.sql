-- Habilitar extensión
create extension if not exists vector;

-- Tabla de documentos
create table documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(3072)  -- 3072 dims para gemini-embedding-2-preview
);

-- Función de búsqueda por similitud
create or replace function match_documents(
  query_embedding vector(3072),
  match_count int default 8,
  filter jsonb default '{}'
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language sql stable
as $$
  select id, content, metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by embedding <=> query_embedding
  limit match_count;
$$;