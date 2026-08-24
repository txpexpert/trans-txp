create or replace function match_knowledge_chunks (
  query_embedding vector(1536),
  match_threshold float default 0.72,
  match_count int default 6
)
returns table (
  id uuid,
  contenu text,
  titre text,
  numero text,
  type_document text,
  date_document date,
  source_type text,
  similarity float
)
language sql stable
as $$
  select
    kc.id,
    kc.contenu,
    kc.titre,
    kc.numero,
    kc.type_document,
    kc.date_document,
    kc.source_type,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
