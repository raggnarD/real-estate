'use client'

import { useApiKey } from '@/contexts/ApiKeyContext'
import { useSession } from 'next-auth/react'

/**
 * Debug component to show API key status
 * Remove this component after testing is complete
 */
export default function ApiKeyDebug() {
  const { apiKey, isLoading, guestKey } = useApiKey()
  const { status } = useSession()

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#f0f0f0',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '1rem',
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
        🔍 API Key Debug
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Auth Status:</strong> {status}
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Personal Key:</strong> {apiKey ? `✅ Set (${apiKey.substring(0, 10)}...)` : '❌ Not Set'}
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Guest Key:</strong> {guestKey ? `✅ Active (${guestKey.substring(0, 10)}...)` : '❌ Not Active'}
      </div>
    </div>
  )
}

