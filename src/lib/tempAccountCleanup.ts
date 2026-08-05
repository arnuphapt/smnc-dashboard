import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Deletes all expired temporary expert accounts from Supabase Auth, Profiles table,
 * and clears their references in ethics_submissions.
 */
export async function cleanupExpiredTempAccounts(): Promise<{ deletedCount: number; deletedIds: string[] }> {
  try {
    const admin = createAdminClient()
    const nowIso = new Date().toISOString()

    // 1. Fetch expired temp profiles
    const { data: expiredProfiles, error: fetchErr } = await admin
      .from('profiles')
      .select('id, email')
      .eq('is_temp_account', true)
      .lt('temp_expires_at', nowIso)

    if (fetchErr || !expiredProfiles || expiredProfiles.length === 0) {
      return { deletedCount: 0, deletedIds: [] }
    }

    const deletedIds: string[] = []

    for (const prof of expiredProfiles) {
      // Clear assigned_reviewer_id references
      await admin
        .from('ethics_submissions')
        .update({ assigned_reviewer_id: null })
        .eq('assigned_reviewer_id', prof.id)

      await admin
        .from('ethics_submissions')
        .update({ assigned_reviewer_id_2: null })
        .eq('assigned_reviewer_id_2', prof.id)

      // Delete profile record
      await admin.from('profiles').delete().eq('id', prof.id)

      // Delete Auth user
      await admin.auth.admin.deleteUser(prof.id)

      deletedIds.push(prof.id)
    }

    if (deletedIds.length > 0) {
      console.log(`[TempAccountCleanup] Auto-deleted ${deletedIds.length} expired temp account(s):`, deletedIds)
    }

    return { deletedCount: deletedIds.length, deletedIds }
  } catch (err) {
    console.error('[TempAccountCleanup] Error during cleanup:', err)
    return { deletedCount: 0, deletedIds: [] }
  }
}

/**
 * Deletes a single specific temp account if it is expired.
 */
export async function deleteTempAccountIfExpired(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id, is_temp_account, temp_expires_at')
      .eq('id', userId)
      .single()

    if (!profile || !profile.is_temp_account || !profile.temp_expires_at) {
      return false
    }

    if (new Date(profile.temp_expires_at) < new Date()) {
      // Clear references
      await admin
        .from('ethics_submissions')
        .update({ assigned_reviewer_id: null })
        .eq('assigned_reviewer_id', userId)

      await admin
        .from('ethics_submissions')
        .update({ assigned_reviewer_id_2: null })
        .eq('assigned_reviewer_id_2', userId)

      // Delete profile & auth user
      await admin.from('profiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      console.log(`[TempAccountCleanup] Auto-deleted expired temp user ${userId} on access`)
      return true
    }

    return false
  } catch (err) {
    console.error(`[TempAccountCleanup] Error checking/deleting temp user ${userId}:`, err)
    return false
  }
}
