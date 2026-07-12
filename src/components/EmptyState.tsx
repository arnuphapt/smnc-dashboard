import React from 'react'

// Shared "nothing here yet" treatment — previously duplicated inside Ethics.tsx
// and IPApplication.tsx. An empty screen is an invitation to act, so it always
// gets an icon + a plain-language explanation, never just a bare sentence.
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  body?: string
  dashed?: boolean
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, body, dashed }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 py-14 text-center"
    style={dashed ? { border: '2px dashed #CBD5E1', borderRadius: '1rem' } : undefined}
  >
    <div style={{ color: '#CBD5E1' }}>{icon}</div>
    <div>
      <p className="text-sm font-bold" style={{ color: '#0B1D3A' }}>{title}</p>
      {body && <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{body}</p>}
    </div>
  </div>
)
