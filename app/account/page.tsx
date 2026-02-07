'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { useWizard } from '@/contexts/WizardContext'

export default function AccountPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const {
    apiKey,
    setApiKey
  } = useApiKey()
  const { setWizardStep } = useWizard()
  const [isMobile, setIsMobile] = useState(false)
  const [inputValue, setInputValue] = useState(apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim())
      setPendingChanges(false)
      setSaveMessage('API key saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage('Please enter a valid API key')
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const handleClear = () => {
    setApiKey(null)
    setInputValue('')
    setSaveMessage('Personal API key cleared')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleResetEverything = () => {
    if (!window.confirm('Are you sure you want to reset everything? This will clear your personal key and all saved session data.')) {
      return
    }
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  useEffect(() => {
    setInputValue(apiKey || '')
  }, [apiKey])

  useEffect(() => {
    setPendingChanges(inputValue.trim() !== (apiKey || ''))
  }, [inputValue, apiKey])

  return (
    <div style={{
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '2rem',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ marginTop: 0, color: '#000', marginBottom: '1rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>
        Account Settings
      </h1>

      {/* Session Card */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '2rem',
        backgroundColor: '#fff',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              👤
            </div>
          )}
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
              {status === 'authenticated' ? session.user?.name : 'Guest User'}
            </div>
            <div style={{ color: '#6b7280' }}>
              {status === 'authenticated' ? session.user?.email : 'Sign in to access premium features'}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#f3f4f6' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>Account Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {status === 'authenticated' ? (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#059669', fontWeight: '500' }}>Active (Guest Key Enabled)</span>
                </>
              ) : (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ color: '#dc2626', fontWeight: '500' }}>Disconnected</span>
                </>
              )}
            </div>
          </div>

          {status === 'authenticated' ? (
            <button
              onClick={() => signOut()}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                color: '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => signIn('google')}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0070f3',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#111827', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          Custom API Configuration
        </h2>

        {saveMessage && (
          <div style={{
            padding: '1rem',
            backgroundColor: saveMessage.includes('success') || saveMessage.includes('cleared') ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${saveMessage.includes('success') || saveMessage.includes('cleared') ? '#10b981' : '#ef4444'}`,
            borderRadius: '6px',
            marginBottom: '1.5rem',
            color: saveMessage.includes('success') || saveMessage.includes('cleared') ? '#065f46' : '#991b1b',
            fontSize: '0.875rem'
          }}>
            {saveMessage}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
            Personal Google Maps API Key:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your personal key (optional)"
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#111827',
                backgroundColor: '#fff',
                fontFamily: showKey ? 'monospace' : 'inherit'
              }}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!pendingChanges || !inputValue.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: (pendingChanges && inputValue.trim()) ? '#0070f3' : '#d1d5db',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: (pendingChanges && inputValue.trim()) ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            Save Key
          </button>

          {apiKey && (
            <button
              onClick={handleClear}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fff',
                color: '#ef4444',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Clear Key
            </button>
          )}
        </div>

        <div style={{ marginTop: '2rem', padding: '1.25rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💡</span> About Guest Access
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e3a8a', lineHeight: '1.5' }}>
            We provide a guest API key automatically for authenticated users.
            Custom keys are only needed for higher usage limits or specialized development needs.
          </p>
        </div>
      </div>

      <div style={{ border: '1px solid #fee2e2', borderRadius: '12px', padding: '2rem', backgroundColor: '#fff' }}>
        <h2 style={{ marginTop: 0, color: '#991b1b', fontSize: '1.125rem', fontWeight: '600' }}>Danger Zone</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Clear all stored preferences and reset the application state.</p>
        <button
          onClick={handleResetEverything}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: '#fff',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff'
          }}
        >
          Reset Application Data
        </button>
      </div>
    </div>
  )
}
