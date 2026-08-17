import { getMediaUrl } from '@/services/supabase'

describe('supabase service helpers', () => {
  describe('getMediaUrl', () => {
    it('returns empty string for null, undefined, or empty path', () => {
      expect(getMediaUrl(null)).toBe('')
      expect(getMediaUrl(undefined)).toBe('')
      expect(getMediaUrl('')).toBe('')
    })

    it('returns original string for full URLs, data URLs, and blob URLs', () => {
      expect(getMediaUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg')
      expect(getMediaUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg')
      expect(getMediaUrl('data:image/png;base64,123')).toBe('data:image/png;base64,123')
      expect(getMediaUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123')
    })

    it('resolves relative storage paths to public Supabase URL', () => {
      const publicUrl = getMediaUrl('images/logo.png', true)
      expect(publicUrl).toContain('wisdom-public/images/logo.png')

      const privateUrl = getMediaUrl('documents/doc.pdf', false)
      expect(privateUrl).toContain('wisdom-private/documents/doc.pdf')
    })

    it('cleans bucket prefix if already present in path', () => {
      const url = getMediaUrl('wisdom-public/images/photo.jpg')
      expect(url).toContain('wisdom-public/images/photo.jpg')
    })
  })
})
