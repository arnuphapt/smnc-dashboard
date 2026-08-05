-- supabase/migrations/20260805120000_add_ethics_evaluations.sql
-- Adds a per-reviewer evaluation child table so each of the (up to 2) assigned
-- reviewers on an ethics_submissions row gets their own status/reviewer_notes,
-- instead of sharing a single column pair that the last save overwrites.

create table if not exists ethics_evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references ethics_submissions(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  status text not null,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, reviewer_id)
);

create index if not exists idx_ethics_evaluations_submission_id on ethics_evaluations (submission_id);

alter table ethics_evaluations enable row level security;

-- SELECT: the evaluation's own reviewer, either assigned reviewer on the parent
-- submission, or an admin. Submitters are intentionally NOT included here to
-- preserve the existing anonymity property (submitters only ever see the
-- generic "คณะกรรมการประเมิน" label, never which specific expert wrote what).
create policy "Allow reviewers and admins to view evaluations"
  on ethics_evaluations for select
  using (
    auth.uid() = reviewer_id
    or exists (
      select 1 from ethics_submissions s
      where s.id = ethics_evaluations.submission_id
        and (s.assigned_reviewer_id = auth.uid() or s.assigned_reviewer_id_2 = auth.uid())
    )
    or exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- INSERT/UPDATE: only the reviewer writing their own row, and only if they are
-- actually assigned (checks BOTH assigned_reviewer_id and assigned_reviewer_id_2 —
-- this is the fix for the pre-existing bug on ethics_submissions's own UPDATE
-- policy, which only ever checked assigned_reviewer_id). Admins may also write.
create policy "Allow assigned reviewers and admins to insert evaluations"
  on ethics_evaluations for insert
  with check (
    (
      auth.uid() = reviewer_id
      and exists (
        select 1 from ethics_submissions s
        where s.id = ethics_evaluations.submission_id
          and (s.assigned_reviewer_id = auth.uid() or s.assigned_reviewer_id_2 = auth.uid())
      )
    )
    or exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Allow assigned reviewers and admins to update evaluations"
  on ethics_evaluations for update
  using (
    (
      auth.uid() = reviewer_id
      and exists (
        select 1 from ethics_submissions s
        where s.id = ethics_evaluations.submission_id
          and (s.assigned_reviewer_id = auth.uid() or s.assigned_reviewer_id_2 = auth.uid())
      )
    )
    or exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    (
      auth.uid() = reviewer_id
      and exists (
        select 1 from ethics_submissions s
        where s.id = ethics_evaluations.submission_id
          and (s.assigned_reviewer_id = auth.uid() or s.assigned_reviewer_id_2 = auth.uid())
      )
    )
    or exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- DELETE: admin only — mirrors ethics_submissions delete policy being
-- submitter-or-admin, but reviewers have no UI to delete their own evaluation
-- post-submission, so it isn't extended to them here.
create policy "Allow admins to delete evaluations"
  on ethics_evaluations for delete
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Backfill: existing submissions with a non-null reviewer_notes represent one
-- real reviewer's work that would otherwise vanish from the "who evaluated"
-- view. Only backfilled when assigned_reviewer_id is set — if it's null
-- (orphaned notes with no identifiable reviewer), the row is skipped rather
-- than guessing an identity. This is additive only; it does not touch/delete
-- the original ethics_submissions.reviewer_notes column.
insert into ethics_evaluations (submission_id, reviewer_id, status, reviewer_notes, created_at, updated_at)
select id, assigned_reviewer_id, status, reviewer_notes, created_at, updated_at
from ethics_submissions
where reviewer_notes is not null and assigned_reviewer_id is not null
on conflict (submission_id, reviewer_id) do nothing;
