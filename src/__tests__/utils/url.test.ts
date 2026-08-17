import { getBaseUrl } from '@/utils/url'

describe('url utils', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns NEXT_PUBLIC_SITE_URL when set in server environment', () => {
    delete (global as any).window
    process.env.NEXT_PUBLIC_SITE_URL = 'https://smnc-dashboard.com/'

    expect(getBaseUrl()).toBe('https://smnc-dashboard.com')
  })

  it('returns VERCEL_URL when NEXT_PUBLIC_SITE_URL is not set', () => {
    delete (global as any).window
    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.VERCEL_URL = 'smnc-app.vercel.app'

    expect(getBaseUrl()).toBe('https://smnc-app.vercel.app')
  })

  it('returns fallback localhost when no environment variables are set', () => {
    delete (global as any).window
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_URL

    expect(getBaseUrl()).toBe('http://localhost:3000')
  })
})
