export interface AuthorItem {
  name: string
  contribution: string
}

export const parseAuthors = (rawStr?: string | null): AuthorItem[] => {
  if (!rawStr) return []
  const trimmed = rawStr.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            return { name: item, contribution: 'Co author' }
          }
          return {
            name: item.name || '',
            contribution: item.contribution || 'Co author',
          }
        }).filter((a) => Boolean(a.name && a.name.trim()))
      }
    } catch {
      // Fallback if JSON parse fails
    }
  }
  
  // Fallback for plain comma-separated text string
  return trimmed
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((name) => ({ name, contribution: 'Co author' }))
}

export const formatAuthorsForDisplay = (
  rawStr?: string | null,
  profiles?: Array<{ email: string; full_name?: string }>
): string => {
  if (!rawStr) return ''
  const list = parseAuthors(rawStr)
  if (list.length === 0) return rawStr

  const profileMap = new Map<string, string>()
  if (profiles && Array.isArray(profiles)) {
    profiles.forEach((p) => {
      if (p.email && p.full_name) {
        profileMap.set(p.email.toLowerCase().trim(), p.full_name.trim())
      }
    })
  }

  return list
    .map((a) => {
      const displayName = profileMap.get(a.name.toLowerCase().trim()) || a.name
      return a.contribution ? `${displayName} (${a.contribution})` : displayName
    })
    .join(', ')
}
