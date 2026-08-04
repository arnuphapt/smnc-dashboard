import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getMediaUrl = (urlOrPath?: string | null, isPublic: boolean = true) => {
  if (!urlOrPath) return ''
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://') || urlOrPath.startsWith('data:') || urlOrPath.startsWith('blob:')) {
    return urlOrPath
  }
  const cleanPath = urlOrPath.replace(/^(wisdom-public\/|wisdom-private\/)/, '')
  const bucket = (cleanPath.startsWith('images/') || isPublic) ? 'wisdom-public' : 'wisdom-private'
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath)
  return data.publicUrl
}

