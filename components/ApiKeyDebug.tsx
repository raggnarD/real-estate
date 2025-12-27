'use client'

import { useApiKey } from '@/contexts/ApiKeyContext'

/**
 * Debug component to show API key status
 * Remove this component after testing is complete
 */
export default function ApiKeyDebug() {
  const { apiKey, isDemoMode, isLoading, forceDemoMode } = useApiKey()

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#f0f0f0',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '1rem',
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
        🔍 API Key Debug
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Demo Mode:</strong> {isDemoMode ? '✅ Yes' : '❌ No'}
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>Force Demo:</strong> {forceDemoMode ? '✅ On' : '❌ Off'}
      </div>
      <div style={{ marginBottom: '0.25rem' }}>
        <strong>API Key:</strong> {apiKey ? `✅ Set (${apiKey.substring(0, 10)}...)` : '❌ Not Set'}
      </div>
      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ccc', fontSize: '0.7rem', color: '#666' }}>
        Env Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Not Set'}
      </div>
    </div>
  )
}

