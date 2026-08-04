import { isValidSmncEmail, SMNC_EMAIL_DOMAIN } from './validation'

describe('validation utils', () => {
  it('defines correct domain constant', () => {
    expect(SMNC_EMAIL_DOMAIN).toBe('@smnc.ac.th')
  })

  it('validates emails ending with @smnc.ac.th case-insensitively', () => {
    expect(isValidSmncEmail('user@smnc.ac.th')).toBe(true)
    expect(isValidSmncEmail('ADMIN@SMNC.AC.TH')).toBe(true)
    expect(isValidSmncEmail('  test@smnc.ac.th  ')).toBe(true)
  })

  it('rejects invalid email domains', () => {
    expect(isValidSmncEmail('user@gmail.com')).toBe(false)
    expect(isValidSmncEmail('user@smnc.ac.th.com')).toBe(false)
    expect(isValidSmncEmail('smnc.ac.th')).toBe(false)
    expect(isValidSmncEmail('')).toBe(false)
  })
})
