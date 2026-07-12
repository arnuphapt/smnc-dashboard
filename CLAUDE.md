# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc typecheck + vite build (this is the only typecheck step — there is no separate `lint`/`typecheck` script)
npm run preview   # preview the production build
```

There is no test runner configured in this repo.

`node generate_seed.js` reads `Database กลุ่มวิจัย หลังบ้าน.xlsx` (gitignored, real institutional data) and writes `seed.sql` (also gitignored) — bulk INSERTs into `wisdom_items` for the 5 wisdom-repository sheets. Both the xlsx and generated sql are excluded from git (`*.xlsx`, `*.sql` in `.gitignore`).

## Architecture

**Stack:** Vite + React 19 + TypeScript, single-page app with no router (navigation is a plain `activeTab` string in `App.tsx`, not URL-based). Tailwind v4 via `@tailwindcss/postcss`. Supabase (`@supabase/supabase-js`) is the entire backend — Postgres, Auth, Storage, and Realtime. There is no custom server; all data access is client-side Supabase calls guarded by Postgres RLS.

**Env:** `src/services/supabase.ts` reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env` (gitignored) and throws if missing.

### Data model — `wisdom_items` is the core table

The "ห้าคลังพลังปัญญา" (five wisdom repositories: research, innovation, intellectual_property, award, utilization) are **not** five separate tables. They are one polymorphic table, `wisdom_items`, with a `category` column and a JSONB `metadata` column holding category-specific fields (e.g. `journal_rank`/`journal_name` for research, `ip_type`/`registration_number` for IP, `award_level`/`organizer` for awards). `src/pages/Dashboard.tsx` defines the `WisdomItem` interface — treat it as the canonical shape. `src/pages/Repositories.tsx` renders all five categories from this one table, switching columns/filters based on `activeCategory`. When adding a field to a category, it goes into `metadata`, not a new column — check `AdminPanel.tsx`'s `handleItemSubmit` for how metadata is assembled per category, and `Repositories.tsx`'s `labelMap` for how metadata keys get Thai display labels.

Dropdown options shown across the app (research type, IP type, award level, department, etc.) are **not hardcoded** — they live in the `lookup_options` table (`category`, `value`, `label`, `sort_order`) and are loaded/cached by `src/context/LookupContext.tsx`, which also subscribes to realtime changes so admin edits propagate live to every open tab.

**Note on migrations:** only Phase 2 tables (`clinic_info`, `appointments`, `clinic_events`, `event_registrations`, `downloadable_forms`, `ethics_submissions`, `ethics_attachments`, `ip_applications`) have a tracked migration (`supabase/migrations/20260712000000_phase2_schema.sql`). The core tables (`profiles`, `wisdom_items`, `lookup_options`) and their RLS policies, storage buckets, and the presumed "first signup becomes admin" trigger were created directly against the Supabase project and are **not** in this repo — check the live Supabase dashboard/SQL, don't assume the migrations folder is the full schema.

### Auth & roles

`AuthScreen.tsx` restricts sign-in/sign-up client-side to `@smnc.ac.th` emails. `src/context/AuthContext.tsx` loads the matching row from `profiles` (`role: 'admin' | 'teacher' | 'expert'`) after session load, with a retry/delay for when the profile-creation trigger hasn't fired yet. Role gates are enforced both in the UI (e.g. `App.tsx` hides the Admin nav item, `Ethics.tsx` hides the reviewer tab unless `role === 'expert' | 'admin'`) and in Postgres RLS policies (every Phase 2 policy checks `profiles.role = 'admin'` or an assigned-user match) — when changing access rules, both layers need updating.

### Realtime pattern (repeated across nearly every page)

Every data-bearing page/context follows the same shape: fetch on mount, then `supabase.channel('<name>-realtime').on('postgres_changes', { event: '*', schema: 'public', table: '<table>' }, () => refetch()).subscribe()`, with `supabase.removeChannel(channel)` in the effect cleanup. See `LookupContext.tsx`, `Dashboard.tsx`, `Repositories.tsx`, `AdminPanel.tsx`, `Clinic.tsx`, `Ethics.tsx`, `IPApplication.tsx` for examples — when adding a new data view, follow this same subscribe/refetch/cleanup shape rather than diffing individual payloads.

### Storage buckets

Two buckets: `wisdom-public` (public files/images for `wisdom_items`, served via `getPublicUrl`) and `wisdom-private` (gated files, served via short-lived `createSignedUrl`). `wisdom-private` is reused beyond its name for ethics submission attachments (`Ethics.tsx` uploads to `ethics/<user_id>/...` in `wisdom-private`), so don't assume the bucket name maps 1:1 to a feature.

### IP application → catalog transfer

`ip_applications` (Phase 2, "การขึ้นทะเบียนทรัพย์สินทางปัญญา" workflow) is deliberately separate from the `wisdom_items` IP catalog entries — it tracks an in-progress registration request. When admin approves and enters a request number, `AdminPanel.handleTransferToCatalog` inserts a new `wisdom_items` row (`category: 'intellectual_property'`) and flips `ip_applications.transferred_to_catalog = true`. Don't conflate the two tables.

### Page composition

`App.tsx` owns the tab switch and renders `Dashboard`, `Repositories` (shared by all 5 wisdom categories), `AdminPanel` (role-gated, itself has 6 sub-tabs: items/lookups/users/clinic/ethics/ip — each with its own fetch functions and realtime subscriptions), `Clinic`, `Ethics`, and `IPApplication`. There's no shared layout component beyond what's inlined in `App.tsx`'s header/footer.
