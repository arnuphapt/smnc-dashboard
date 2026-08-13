-- Migration: Add is_confirmed column to profiles for manual Admin approval
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_confirmed boolean DEFAULT false;

-- Sync existing profiles with auth.users email_confirmed_at
UPDATE public.profiles p
SET is_confirmed = true
FROM auth.users au
WHERE p.id = au.id AND au.email_confirmed_at IS NOT NULL;

-- Ensure admins are confirmed
UPDATE public.profiles
SET is_confirmed = true
WHERE role = 'admin' OR is_confirmed IS NULL;
