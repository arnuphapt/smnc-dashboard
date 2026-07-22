import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { Repositories } from './Repositories'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('../context/LookupContext', () => ({
  useLookups: () => ({ getOptionsByCategory: () => [] }),
}))

vi.mock('../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    storage: { from: () => ({ createSignedUrl: vi.fn(), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
  },
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/repositories/:category" element={<Repositories />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Repositories routing', () => {
  it('shows the research repository at /repositories/research', async () => {
    renderAt('/repositories/research')
    expect(await screen.findByRole('heading', { name: 'คลังผลงานวิจัย' })).toBeInTheDocument()
  })

  it('shows the intellectual property repository at /repositories/intellectual_property', async () => {
    renderAt('/repositories/intellectual_property')
    expect(await screen.findByRole('heading', { name: 'คลังทรัพย์สินทางปัญญา' })).toBeInTheDocument()
  })

  it('falls back to the research repository for an unknown category param', async () => {
    renderAt('/repositories/not-a-real-category')
    expect(await screen.findByRole('heading', { name: 'คลังผลงานวิจัย' })).toBeInTheDocument()
  })
})
