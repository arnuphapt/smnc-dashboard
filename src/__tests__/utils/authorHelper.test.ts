import { parseAuthors, formatAuthorsForDisplay } from '@/utils/authorHelper'

describe('authorHelper', () => {
  describe('parseAuthors', () => {
    it('returns empty array when rawStr is null, undefined, or empty', () => {
      expect(parseAuthors(null)).toEqual([])
      expect(parseAuthors(undefined)).toEqual([])
      expect(parseAuthors('')).toEqual([])
      expect(parseAuthors('   ')).toEqual([])
    })

    it('parses valid JSON array of object author items', () => {
      const input = JSON.stringify([
        { name: 'Dr. Smith', contribution: 'First author' },
        { name: 'Jane Doe', contribution: 'Corresponding author' },
        { name: 'John', contribution: '' },
      ])
      const result = parseAuthors(input)
      expect(result).toEqual([
        { name: 'Dr. Smith', contribution: 'First author' },
        { name: 'Jane Doe', contribution: 'Corresponding author' },
        { name: 'John', contribution: 'Co author' },
      ])
    })

    it('parses valid JSON array of string items', () => {
      const input = JSON.stringify(['Alice', 'Bob'])
      const result = parseAuthors(input)
      expect(result).toEqual([
        { name: 'Alice', contribution: 'Co author' },
        { name: 'Bob', contribution: 'Co author' },
      ])
    })

    it('filters out empty name items in JSON parse', () => {
      const input = JSON.stringify([{ name: '' }, { name: '  ' }])
      expect(parseAuthors(input)).toEqual([])
    })

    it('falls back to comma-separated parsing if JSON parsing fails', () => {
      const input = '[invalid JSON'
      expect(parseAuthors(input)).toEqual([
        { name: '[invalid JSON', contribution: 'Co author' },
      ])
    })

    it('parses plain comma-separated strings', () => {
      const input = 'Alice, Bob, , Charlie'
      const result = parseAuthors(input)
      expect(result).toEqual([
        { name: 'Alice', contribution: 'Co author' },
        { name: 'Bob', contribution: 'Co author' },
        { name: 'Charlie', contribution: 'Co author' },
      ])
    })
  })

  describe('formatAuthorsForDisplay', () => {
    it('returns empty string for null, undefined, or empty input', () => {
      expect(formatAuthorsForDisplay(null)).toBe('')
      expect(formatAuthorsForDisplay(undefined)).toBe('')
      expect(formatAuthorsForDisplay('')).toBe('')
    })

    it('formats author list without profile mappings', () => {
      const input = JSON.stringify([
        { name: 'Alice', contribution: 'First author' },
        { name: 'Bob', contribution: 'Co author' },
      ])
      expect(formatAuthorsForDisplay(input)).toBe('Alice (First author), Bob (Co author)')
    })

    it('replaces email names with profile full_names when available', () => {
      const input = JSON.stringify([
        { name: 'alice@example.com', contribution: 'First author' },
        { name: 'Bob', contribution: 'Co author' },
      ])
      const profiles = [
        { email: 'alice@example.com', full_name: 'Dr. Alice Smith' },
        { email: 'other@example.com', full_name: 'Other' },
      ]
      expect(formatAuthorsForDisplay(input, profiles)).toBe('Dr. Alice Smith (First author), Bob (Co author)')
    })

    it('handles profiles without full_name or email cleanly', () => {
      const input = JSON.stringify([{ name: 'alice@example.com', contribution: 'First author' }])
      const profiles = [{ email: 'alice@example.com' } as any]
      expect(formatAuthorsForDisplay(input, profiles)).toBe('alice@example.com (First author)')
    })
  })
})
