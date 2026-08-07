-- supabase/migrations/20260806000000_add_roles_table.sql
-- Adds a `roles` table so admins can create brand-new roles at runtime
-- instead of being limited to 4 hardcoded roles. `key` doubles as the value
-- stored in profiles.role / role_permissions.role (comma-separated multi-role
-- string), so it's the PK directly rather than a separate UUID.

create table if not exists roles (
  key text primary key,
  label text not null,
  short_label text not null,
  description text not null default '',
  icon_name text not null default 'Shield',
  color_key text not null default 'slate',
  is_locked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Seed the 4 existing roles verbatim (same label/desc/colors as today's
-- hardcoded ROLE_OPTIONS/ROLES arrays in roleHelper.ts / RolesTab.tsx).
insert into roles (key, label, short_label, description, icon_name, color_key, is_locked, sort_order) values
  ('teacher', 'อาจารย์ (Teacher)', 'อาจารย์', 'คณาจารย์และบุคลากรทั่วไปที่ใช้งานระบบยื่นคำขอและสืบค้นข้อมูล', 'GraduationCap', 'teal', false, 1),
  ('expert', 'ผู้ทรงคุณวุฒิ (Expert)', 'ผู้ทรงคุณวุฒิ', 'ผู้ทรงคุณวุฒิที่ได้รับมอบหมายเพื่อพิจารณาจริยธรรมการวิจัยของโครงการวิจัย', 'UserCheck', 'purple', false, 2),
  ('assistant_admin', 'ผู้ช่วยแอดมิน (Assistant Admin)', 'ผู้ช่วยแอดมิน', 'ผู้ช่วยดูแลระบบ เข้าถึงและจัดการระบบได้ตามสิทธิ์ที่ได้รับมอบหมาย', 'Shield', 'orange', false, 3),
  ('admin', 'ผู้ดูแลระบบ (Admin)', 'ผู้ดูแลระบบ', 'ผู้ดูแลระบบที่มีสิทธิ์สูงสุด สิทธิ์การเข้าถึงทุกหน้าถูกล็อกถาวร', 'Shield', 'red', true, 4)
on conflict (key) do nothing;

-- Ensure is_admin helper function exists in public schema
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and (role = 'admin' or role like '%admin%' or role like 'admin,%' or role like '%, admin%')
  );
$$;

alter table roles enable row level security;

-- SELECT: public read — role labels/icons need to be readable app-wide to
-- render badges/labels, matching role_permissions's existing public-read policy.
drop policy if exists "Allow public read access to roles" on roles;
create policy "Allow public read access to roles"
  on roles for select
  using (true);

-- INSERT/UPDATE/DELETE: gated by is_admin() or direct profile check
drop policy if exists "Allow admins to insert roles" on roles;
create policy "Allow admins to insert roles"
  on roles for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.role like '%admin%')
    )
  );

drop policy if exists "Allow admins to update roles" on roles;
create policy "Allow admins to update roles"
  on roles for update
  using (
    public.is_admin()
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.role like '%admin%')
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.role like '%admin%')
    )
  );

drop policy if exists "Allow admins to delete roles" on roles;
create policy "Allow admins to delete roles"
  on roles for delete
  using (
    public.is_admin()
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'admin' or profiles.role like '%admin%')
    )
  );
