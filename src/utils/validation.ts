export const SMNC_EMAIL_DOMAIN = '@smnc.ac.th'

export const isValidSmncEmail = (email: string): boolean =>
  email.trim().toLowerCase().endsWith(SMNC_EMAIL_DOMAIN)
