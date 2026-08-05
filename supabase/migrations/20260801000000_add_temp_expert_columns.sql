-- supabase/migrations/20260801000000_add_temp_expert_columns.sql
alter table profiles
  add column if not exists is_temp_account boolean not null default false,
  add column if not exists temp_expires_at timestamptz,
  add column if not exists temp_target_submission_id uuid references ethics_submissions(id) on delete set null;

create index if not exists idx_profiles_temp_expires_at on profiles (temp_expires_at) where is_temp_account = true;
