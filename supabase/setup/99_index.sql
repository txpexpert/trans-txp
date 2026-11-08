-- supabase/setup/99_index.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Index de la base d'origine (relevés le 2026-11-07), à créer APRÈS les
-- migrations (certains utilisent la fonction tarif_dkey de la migration 0007).
-- Tous en « if not exists » : sans effet s'ils existent déjà.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists admin_accounts_email_key       on public.admin_accounts using btree (email);
create unique index if not exists admin_accounts_single_super    on public.admin_accounts using btree (niveau) where (niveau = 'super'::text);
create index if not exists admin_accounts_token_idx              on public.admin_accounts using btree (token_hash) where (token_hash is not null);
create index if not exists audit_reports_user_id_idx             on public.audit_reports using btree (user_id);
create index if not exists conversations_user_id_idx             on public.conversations using btree (user_id);
create index if not exists dossiers_user_id_idx                  on public.dossiers using btree (user_id);
create index if not exists idx_decisions_circulaire              on public.decisions_classement using btree (circulaire);
create index if not exists idx_decisions_code_sh                 on public.decisions_classement using btree (code_sh);
create index if not exists idx_decisions_code_dkey               on public.decisions_classement using btree (code_sh, tarif_dkey(designation));
create unique index if not exists idx_decisions_dedup            on public.decisions_classement using btree (designation, code_sh);
create index if not exists idx_tarifs_chapitre                   on public.tarifs using btree (chapitre);
create index if not exists idx_tarifs_code_sh                    on public.tarifs using btree (code_sh);
create index if not exists idx_tarifs_code_dkey                  on public.tarifs using btree (code_sh, tarif_dkey(designation_clean));
create index if not exists idx_tarifs_niveau                     on public.tarifs using btree (niveau);
create index if not exists idx_users_verify_token                on public.users using btree (verify_token);
create index if not exists ingestion_lots_created_idx            on public.ingestion_lots using btree (created_at desc);
create index if not exists invoices_numero_idx                   on public.invoices using btree (numero_abonne);
create index if not exists invoices_status_idx                   on public.invoices using btree (status);
create index if not exists invoices_user_idx                     on public.invoices using btree (user_id);
create index if not exists kc_date_doc_idx                       on public.knowledge_chunks using btree (date_doc desc nulls last);
create index if not exists kc_domaine_idx                        on public.knowledge_chunks using btree (domaine);
create index if not exists knowledge_chunks_domaine_idx          on public.knowledge_chunks using btree (domaine);
create index if not exists knowledge_chunks_numero_idx           on public.knowledge_chunks using btree (numero);
create index if not exists knowledge_chunks_source_type_idx      on public.knowledge_chunks using btree (source_type);
create index if not exists knowledge_chunks_statut_idx           on public.knowledge_chunks using btree (statut);
create index if not exists knowledge_chunks_type_document_idx    on public.knowledge_chunks using btree (type_document);
create index if not exists messages_conversation_id_idx          on public.messages using btree (conversation_id);
create index if not exists messages_user_id_idx                  on public.messages using btree (user_id);
create index if not exists scanner_reports_user_id_idx           on public.scanner_reports using btree (user_id);
create index if not exists subscription_events_created_idx       on public.subscription_events using btree (created_at desc);
create index if not exists subscription_events_numero_idx        on public.subscription_events using btree (numero_abonne);
create index if not exists subscription_events_user_idx          on public.subscription_events using btree (user_id);
create index if not exists tarifs_historique_code_idx            on public.tarifs_historique using btree (code_sh);
create index if not exists tariff_searches_user_id_idx           on public.tariff_searches using btree (user_id);
create index if not exists user_memories_user_id_idx             on public.user_memories using btree (user_id);
create index if not exists user_memories_embedding_idx           on public.user_memories using ivfflat (embedding vector_cosine_ops) with (lists = '100');
create unique index if not exists users_numero_abonne_key        on public.users using btree (numero_abonne);
create index if not exists user_sessions_created_idx             on public.user_sessions using btree (created_at desc);
create index if not exists user_sessions_numero_idx              on public.user_sessions using btree (numero_abonne);
