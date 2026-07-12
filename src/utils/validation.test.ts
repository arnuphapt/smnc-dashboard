import { describe, it, expect } from 'vitest'
import { isValidSmncEmail } from './validation'

describe('isValidSmncEmail', () => {
  it('accepts emails on the smnc.ac.th domain', () => {
    expect(isValidSmncEmail('teacher@smnc.ac.th')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isValidSmncEmail('Teacher@SMNC.AC.TH')).toBe(true)
  })

  it('trims surrounding whitespace before checking', () => {
    expect(isValidSmncEmail('  teacher@smnc.ac.th  ')).toBe(true)
  })

  it('rejects other domains', () => {
    expect(isValidSmncEmail('someone@gmail.com')).toBe(false)
  })

  it('rejects lookalike domains that merely contain the suffix', () => {
    expect(isValidSmncEmail('teacher@notsmnc.ac.th.evil.com')).toBe(false)
  })
})
