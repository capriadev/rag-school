create extension if not exists vector;

create table users (
  id_user text primary key,
  mail    text not null unique,
  f_union timestamp with time zone default now()
);

create table profiles (
  id_profile  bigserial primary key,
  name        text not null unique,
  description text,
  active      boolean not null default true,
  doc_count   int not null default 0,
  f_created   timestamp with time zone default now()
);

create table documents (
  id_doc     bigserial primary key,
  id_profile bigint not null references profiles(id_profile) on delete cascade,
  content    text,
  metadata   jsonb not null default '{}',
  embedding  vector(3072),
  f_created  timestamp with time zone default now()
);

create index idx_documents_profile on documents(id_profile);

-- Trigger: mantiene doc_count sincronizado
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

-- Función de búsqueda
-- IVFFlat.probes dinámico: sqrt(lists) es el sweet spot entre velocidad y recall
-- lists se estima como sqrt(doc_count) al momento de crear el índice
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
  probes     int;
begin
  select doc_count into total_docs
  from profiles
  where id_profile = profile_id and active = true;

  if total_docs is null then return; end if;

  -- Probes dinámico basado en doc_count real del perfil
  -- sqrt(sqrt(total_docs)) escala suave: no penaliza perfiles chicos
  -- mínimo 3, máximo 50
  probes := greatest(3, least(50, ceil(sqrt(sqrt(total_docs::float)))::int * 3));
  perform set_config('ivfflat.probes', probes::text, true);

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

-- ============================================================
-- ÍNDICE IVFFLAT
-- Ejecutar DESPUÉS de insertar los primeros chunks
-- lists = sqrt(total de docs al momento de crearlo)
-- Si la DB crece mucho, reindexar: REINDEX INDEX idx_documents_embedding;
-- ============================================================
-- create index idx_documents_embedding on documents
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);