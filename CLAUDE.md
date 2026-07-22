# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # start Next.js dev server
npm run build           # next build (this is the typecheck step — there is no separate `lint`/`typecheck` script)
npm run start           # start production server
npm test                # vitest run
npm run test:watch      # vitest watch mode
npm run test:coverage   # vitest run --coverage
```

Run a single test file: `npx vitest run src/utils/format.test.ts`. No `vitest.config.*` exists in the repo — Vitest picks up config implicitly; `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`) is the test setup file.

`node generate_seed.js` reads `Database กลุ่มวิจัย หลังบ้าน.xlsx` (gitignored, real institutional data) and writes `seed.sql` (also gitignored) — bulk INSERTs into `wisdom_items` for the 5 wisdom-repository sheets. Both the xlsx and generated sql are excluded from git (`*.xlsx`, `*.sql` in `.gitignore`).

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript. Recently migrated off Vite/react-router (the old `src/App.tsx`, `src/main.tsx`, `vite.config.ts`, and flat `src/pages/*` tree are gone — don't recreate that pattern). Tailwind v4 via `@tailwindcss/postcss`. Supabase (`@supabase/supabase-js` + `@supabase/ssr`) is the entire backend — Postgres, Auth, Storage, Realtime. There is no custom API layer; pages/components call Supabase directly, guarded by Postgres RLS. `@tanstack/react-query` was added for the master-table lookup hooks (`src/hooks/queries/`) but most of the app still uses plain `useEffect` + realtime-subscription fetching — don't assume React Query is used everywhere.

**Route structure — thin page wrappers over `src/components/views/`:**
- `src/app/(dashboard)/` — public/authenticated dashboard: `page.tsx` (home), `repositories/[category]/`, `clinic/`, `ethics/`, `ip-application/`. Layout renders `Sidebar` + `Topbar`.
- `src/app/(admin)/master/` — admin backend, gated in `layout.tsx` by `hasRole(profile?.role, 'admin')` (renders an `AccessDenied` panel otherwise, does not redirect). Sub-routes: `items/[category]/`, `lookups/[type]/`, `users/`, `roles/`, `clinic/`, `ethics/`, `ip/` — every one of these route files just renders `<MasterdataPanel />`; the `[category]`/`[type]` dynamic segments are read inside `MasterdataPanel`/`useParams`, not passed as page props.
- `src/app/(auth)/login/` — renders `AuthScreen`, redirects to `/` if already authenticated.

Nearly every `page.tsx` is a one-line `'use client'` wrapper (`export default function XPage() { return <ViewComponent /> }`). **Real logic lives in `src/components/views/*.tsx`, not under `src/app/`.** When asked to modify a "page," look in `views/` first.

Navigation/sidebar structure (which slugs exist per section, their Thai labels and icons) is centralized in `src/config/navigation.ts` (`REPOSITORY_SUBNAV`, `MASTERDATA_SUBNAV`) — update this when adding a new repository category or admin sub-tab, rather than hardcoding links in `Sidebar.tsx`.

**Auth guarding is two-layer and inconsistent by design:**
- `src/middleware.ts` redirects unauthenticated requests to `/login` for paths starting with `/master`, `/clinic`, `/ethics`, `/ip-application` (server-side, via `@supabase/ssr` cookie session).
- `(admin)/master/layout.tsx` additionally checks `role === 'admin'` client-side and renders an access-denied panel (not a redirect).
- Role/session state itself comes from `src/context/AuthContext.tsx` (`useAuth()`), which loads the `profiles` row after session load with a retry/delay for when the profile-creation trigger hasn't fired yet.

### Supabase client split — three entry points, don't cross them

- `src/lib/supabase/client.ts` — `createClient()` via `createBrowserClient`, for Client Components.
- `src/lib/supabase/server.ts` — async `createClient()` via `createServerClient` + `next/headers` cookies, for Server Components/Server Actions.
- `src/services/supabase.ts` — legacy singleton `supabase` client (still actively imported by `masterdata/*Tab.tsx` and `Dashboard.tsx`) plus the `getMediaUrl(urlOrPath, isPublic)` helper that resolves storage paths to public/signed-style URLs. This file is **not dead code** — it's where `getMediaUrl` lives — but new code should prefer `src/lib/supabase/client.ts` for the client itself.

`src/middleware.ts` and both `lib/supabase/*` files read `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not the old Vite `VITE_*` names). `src/services/supabase.ts` still falls back to `import.meta.env.VITE_*` for compatibility but that path is effectively unused under Next.js.

### Data model — `wisdom_items` is the core table

The "ห้าคลังพลังปัญญา" (five wisdom repositories: research, innovation, intellectual_property, award, utilization) are **not** five separate tables. They are one polymorphic table, `wisdom_items`, with a `category` column and a JSONB `metadata` column holding category-specific fields (e.g. `journal_rank`/`journal_name` for research, `ip_type`/`registration_number` for IP, `award_level`/`organizer` for awards). The `WisdomItem` interface is defined in `src/components/views/Dashboard.tsx` — treat it as the canonical shape. `src/components/views/Repositories.tsx` renders all five categories from this one table, switching columns/filters based on the active category (driven by the `[category]` route segment). When adding a field to a category, it goes into `metadata`, not a new column — check `MasterdataPanel`/`ItemFormModal.tsx`'s submit handler for how metadata is assembled per category, and `Repositories.tsx`'s label map for how metadata keys get Thai display labels.

Dropdown options shown across the app (research type, IP type, award level, department, etc.) are **not hardcoded** — they live in the `lookup_options` table (`category`, `value`, `sort_order`) and are loaded/cached by `src/context/LookupContext.tsx`, which subscribes to realtime changes so admin edits propagate live to every open tab. Separately, `src/hooks/queries/useMasterTables.ts` exposes React Query hooks (`useMasterDepartments`, `useMasterYears`, etc.) reading from dedicated `master_*` tables — these are a different mechanism from `lookup_options`/`LookupContext`, used in newer form code; don't conflate the two lookup systems.

**Note on migrations:** the `supabase/migrations/` folder referenced by older docs is not present in the working tree — there is no tracked migration file in this repo currently. Core tables (`profiles`, `wisdom_items`, `lookup_options`, `master_*`) and their RLS policies, storage buckets, and the "first signup becomes admin" trigger live only in the Supabase project itself — check the live Supabase dashboard/SQL, don't assume any file in-repo is the full schema.

### Realtime pattern (repeated across nearly every data view)

Fetch on mount, then `supabase.channel('<name>-realtime').on('postgres_changes', { event: '*', schema: 'public', table: '<table>' }, () => refetch()).subscribe()`, with `supabase.removeChannel(channel)` in the effect cleanup. See `LookupContext.tsx`, `Dashboard.tsx`, `Repositories.tsx`, `MasterdataPanel.tsx`, `Clinic.tsx`, `Ethics.tsx`, `IPApplication.tsx` for examples — when adding a new data view, follow this same subscribe/refetch/cleanup shape rather than diffing individual payloads or fully switching to React Query.

### Storage buckets

Two buckets: `wisdom-public` (public files/images for `wisdom_items`) and `wisdom-private` (gated files, served via short-lived signed URLs). `getMediaUrl` in `src/services/supabase.ts` picks the bucket based on its `isPublic` argument. `wisdom-private` is reused beyond its name for ethics submission attachments (`Ethics.tsx` uploads to `ethics/<user_id>/...` in `wisdom-private`), so don't assume the bucket name maps 1:1 to a feature.

### IP application → catalog transfer

`ip_applications` (the "การขึ้นทะเบียนทรัพย์สินทางปัญญา" workflow, surfaced at `(dashboard)/ip-application/` and admin-side at `(admin)/master/ip/`) is deliberately separate from the `wisdom_items` IP catalog entries — it tracks an in-progress registration request. When admin approves and enters a request number, the transfer handler inserts a new `wisdom_items` row (`category: 'intellectual_property'`) and flips `ip_applications.transferred_to_catalog = true`. Don't conflate the two tables.

### Component layout conventions

- `src/components/layout/` — `Sidebar.tsx`, `Topbar.tsx`, shared by both `(dashboard)` and `(admin)/master` layouts.
- `src/components/views/` — one file per top-level page's actual implementation (`Dashboard`, `Repositories`, `Clinic`, `Ethics`, `IPApplication`, `AuthScreen`, `MasterdataPanel`), plus `views/masterdata/*Tab.tsx` for `MasterdataPanel`'s sub-tabs (items/lookups/users/roles/clinic/ethics/ip).
- `src/components/ui/` — shadcn-style primitives (button, dialog, select, table, etc.) — extend these rather than reaching for a new UI library.
- `src/components/forms/FormField.tsx`, `src/schemas/*.ts` — newer form code uses `react-hook-form` + `@hookform/resolvers` + `zod` schemas; older tabs in `views/masterdata/` still do manual form-state handling. Match whichever pattern the file you're editing already uses rather than mixing both in one component.
- `DataTable.tsx` / `MasterDataTable.tsx` in `src/components/` are the generic table components most list views build on.
- `*.test.ts.bak` files under `views/` are disabled leftover tests from the Vite migration — not currently run by Vitest.
