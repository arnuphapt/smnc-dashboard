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
        }).filter((a) => Boolean(a.name))
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

export const formatAuthorsForDisplay = (rawStr?: string | null): string => {
  if (!rawStr) return ''
  const list = parseAuthors(rawStr)
  if (list.length === 0) return rawStr
  return list
    .map((a) => (a.contribution ? `${a.name} (${a.contribution})` : a.name))
    .join(', ')
}
