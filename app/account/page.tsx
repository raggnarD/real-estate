'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { useWizard } from '@/contexts/WizardContext'
import TermsModal from '@/components/TermsModal'

export default function AccountPage() {
  const router = useRouter()
  const { 
    apiKey, 
    setApiKey, 
    sharedKeyActive,
    sharedKeyExpiresAt,
    sharedKeyTimeRemaining,
    hasExpiredCookie,
    activateSharedKey,
    revokeSharedKey,
    checkSharedKeyStatus
  } = useApiKey()
  const { wizardActive, setWizardStep } = useWizard()
  const [isMobile, setIsMobile] = useState(false)
  const [inputValue, setInputValue] = useState(apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [keyType, setKeyType] = useState<'shared' | 'own'>(apiKey ? 'own' : (sharedKeyActive ? 'shared' : 'own'))
  const [pendingChanges, setPendingChanges] = useState(false)
  const [showInstructions, setShowInstructions] = useState(!apiKey) // Show instructions by default if no API key

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSave = async () => {
    if (keyType === 'shared') {
      // User wants to use shared key
      if (!sharedKeyActive) {
        // Need to activate shared key - show terms modal first
        setShowTermsModal(true)
        return
      } else {
        // Already active, just clear user's API key if they had one
        if (apiKey) {
          setApiKey(null)
          setInputValue('')
        }
        setPendingChanges(false)
        setSaveMessage('Switched to shared API key')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } else {
      // User wants to use their own API key
      if (inputValue.trim()) {
        setApiKey(inputValue.trim())
        // Revoke shared key if active
        if (sharedKeyActive) {
          try {
            await revokeSharedKey()
          } catch (error) {
            console.error('Error revoking shared key:', error)
          }
        }
        setPendingChanges(false)
        setSaveMessage('API key saved successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage('Please enter a valid API key')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    }
  }

  const handleActivateSharedKey = async () => {
    setIsActivating(true)
    try {
      await activateSharedKey()
      setShowTermsModal(false)
      // Clear user's API key if they had one
      if (apiKey) {
        setApiKey(null)
        setInputValue('')
      }
      setPendingChanges(false)
      setSaveMessage('24-hour shared API key activated successfully!')
      setTimeout(() => setSaveMessage(null), 5000)
      
      // If wizard is active, navigate to neighborhood finder
      if (wizardActive) {
        setWizardStep('neighborhood-finder')
        setTimeout(() => {
          router.push('/neighborhood-finder')
        }, 1000) // Small delay to show success message
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate shared key'
      setSaveMessage(errorMessage)
      setTimeout(() => setSaveMessage(null), 10000) // Show error longer
      // Keep modal open on error so user can see the error message
      throw error // Re-throw so modal knows there was an error
    } finally {
      setIsActivating(false)
    }
  }

  const handleClear = async () => {
    // Clear the user's API key from localStorage
    setApiKey(null)
    setInputValue('')
    
    // Also revoke shared key if it's active
    if (sharedKeyActive) {
      try {
        await revokeSharedKey()
        setSaveMessage('API key and shared key cleared')
      } catch (error) {
        console.error('Error revoking shared key:', error)
        setSaveMessage('API key cleared, but failed to revoke shared key')
      }
    } else {
      setSaveMessage('API key cleared')
    }
    
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleResetEverything = async () => {
    if (!window.confirm('Are you sure you want to reset everything? This will:\n\n• Clear your API key\n• Revoke the 24-hour shared key\n• Clear all site cache\n• Show the intro modal again\n\nThis action cannot be undone.')) {
      return
    }

    try {
      // 1. Clear user's API key
      setApiKey(null)
      setInputValue('')
      
      // 2. Revoke shared key if active
      if (sharedKeyActive) {
        try {
          await revokeSharedKey()
        } catch (error) {
          console.error('Error revoking shared key:', error)
        }
      }
      
      // 3. Clear all localStorage items
      localStorage.removeItem('google_maps_api_key')
      localStorage.removeItem('hasSeenIntro')
      
      // 4. Clear sessionStorage
      sessionStorage.clear()
      
      // 5. Clear any other relevant cache
      // Clear address history if stored
      try {
        const addressHistory = localStorage.getItem('address_history')
        if (addressHistory) {
          localStorage.removeItem('address_history')
        }
      } catch (e) {
        // Ignore errors
      }
      
      // 6. Redirect to home page to show intro modal
      router.push('/')
      
      // Small delay to ensure state is cleared before navigation
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Error resetting everything:', error)
      setSaveMessage('Error resetting. Please try again.')
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  // Update input value when apiKey changes externally
  useEffect(() => {
    setInputValue(apiKey || '')
    // Hide instructions when API key is set, show when cleared
    setShowInstructions(!apiKey)
  }, [apiKey])

  // Update keyType when apiKey or sharedKeyActive changes
  useEffect(() => {
    if (apiKey) {
      setKeyType('own')
    } else if (sharedKeyActive) {
      setKeyType('shared')
    }
  }, [apiKey, sharedKeyActive])

  // Track when user makes changes
  useEffect(() => {
    if (keyType === 'shared' && !sharedKeyActive && !apiKey) {
      setPendingChanges(false) // No changes if nothing is set
    } else if (keyType === 'own' && inputValue.trim() !== (apiKey || '')) {
      setPendingChanges(true)
    } else if (keyType === 'shared' && sharedKeyActive && apiKey) {
      setPendingChanges(true) // Switching from own to shared
    } else if (keyType === 'own' && sharedKeyActive && !apiKey) {
      setPendingChanges(true) // Switching from shared to own
    } else {
      setPendingChanges(false)
    }
  }, [keyType, inputValue, apiKey, sharedKeyActive])

  // Update countdown timer and check for expiration
  useEffect(() => {
    if (sharedKeyTimeRemaining !== null && sharedKeyTimeRemaining > 0) {
      setCountdown(sharedKeyTimeRemaining)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1000) {
            // Expired - refresh status
            checkSharedKeyStatus()
            // Show expiration message if there's an expired cookie
            if (hasExpiredCookie) {
              setSaveMessage('Shared API key has expired. Please re-activate to continue using the shared key.')
              setTimeout(() => setSaveMessage(null), 10000)
            }
            return null
          }
          return prev - 1000
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setCountdown(null)
      // Only show expiration message if there's an expired cookie (user previously activated)
      if (hasExpiredCookie && !sharedKeyActive) {
        setSaveMessage('Shared API key has expired. Please re-activate to continue using the shared key.')
        setTimeout(() => setSaveMessage(null), 10000)
      }
    }
  }, [sharedKeyTimeRemaining, sharedKeyActive, hasExpiredCookie, checkSharedKeyStatus])

  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null || ms <= 0) return 'Expired'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const handleRevokeSharedKey = async () => {
    setIsRevoking(true)
    try {
      await revokeSharedKey()
      setSaveMessage('Shared API key revoked successfully')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to revoke shared key')
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <h1 style={{ marginTop: 0, color: '#000', marginBottom: '1rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>
        Account Settings
      </h1>
      <p style={{ color: '#666', marginBottom: isMobile ? '1rem' : '2rem', fontSize: isMobile ? '0.875rem' : '1rem' }}>
        Manage your Google Maps API key and account preferences.
      </p>

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: '#f9f9f9',
        marginBottom: isMobile ? '1rem' : '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1.5rem' }}>
          Google Maps API Key
        </h2>

        {/* Key Type Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '1rem', 
            color: '#000', 
            fontWeight: '500',
            fontSize: '1rem'
          }}>
            Select API Key Type:
          </label>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              border: `2px solid ${keyType === 'shared' ? '#28a745' : '#ddd'}`,
              borderRadius: '4px',
              backgroundColor: keyType === 'shared' ? '#d4edda' : '#fff',
              transition: 'all 0.2s',
              flex: 1,
              minWidth: '200px'
            }}>
              <input
                type="radio"
                name="keyType"
                value="shared"
                checked={keyType === 'shared'}
                onChange={() => {
                  setKeyType('shared')
                  setPendingChanges(true)
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: keyType === 'shared' ? '600' : '400' }}>
                24-Hour Shared Key
              </span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              border: `2px solid ${keyType === 'own' ? '#0070f3' : '#ddd'}`,
              borderRadius: '4px',
              backgroundColor: keyType === 'own' ? '#e6f2ff' : '#fff',
              transition: 'all 0.2s',
              flex: 1,
              minWidth: '200px'
            }}>
              <input
                type="radio"
                name="keyType"
                value="own"
                checked={keyType === 'own'}
                onChange={() => {
                  setKeyType('own')
                  setPendingChanges(true)
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: keyType === 'own' ? '600' : '400' }}>
                My Own API Key
              </span>
            </label>
          </div>
        </div>

        {saveMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: saveMessage.includes('success') || saveMessage.includes('cleared') 
              ? '#d4edda' 
              : '#f8d7da',
            border: `1px solid ${saveMessage.includes('success') || saveMessage.includes('cleared') 
              ? '#28a745' 
              : '#dc3545'}`,
            borderRadius: '4px',
            marginBottom: '1rem',
            color: saveMessage.includes('success') || saveMessage.includes('cleared')
              ? '#155724'
              : '#721c24',
            fontSize: '0.875rem'
          }}>
            {saveMessage}
          </div>
        )}

        {/* Show input field only if "My Own API Key" is selected */}
        {keyType === 'own' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#000', 
              fontWeight: '500',
              fontSize: '1rem'
            }}>
              API Key:
            </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your Google Maps API key"
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                color: '#000',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
                fontFamily: showKey ? 'monospace' : 'inherit'
              }}
            />
            {apiKey && inputValue && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {showKey ? '👁️ Hide' : '👁️ Show'}
              </button>
            )}
          </div>
          {apiKey && (
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: '#666' 
            }}>
              Current key: {showKey ? apiKey : `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`}
            </div>
          )}
          </div>
        )}

        {/* Show shared key info if "24-Hour Shared Key" is selected */}
        {keyType === 'shared' && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0f8ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px'
          }}>
            {sharedKeyActive ? (
              <div>
                <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#004085' }}>
                  <strong>✅ Shared API Key Active</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {countdown !== null && countdown > 0 ? (
                      <div>
                        Time remaining: <strong>{formatTimeRemaining(countdown)}</strong>
                      </div>
                    ) : sharedKeyTimeRemaining !== null ? (
                      <div>
                        Time remaining: <strong>{formatTimeRemaining(sharedKeyTimeRemaining)}</strong>
                      </div>
                    ) : (
                      <div>Checking expiration time...</div>
                    )}
                  </div>
                  {sharedKeyTimeRemaining !== null && sharedKeyTimeRemaining < 60 * 60 * 1000 && (
                    <div style={{ marginTop: '0.5rem', color: '#856404' }}>
                      ⚠️ Less than 1 hour remaining
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Are you sure you want to revoke the shared API key? You can re-activate it later.')) {
                      try {
                        await handleRevokeSharedKey()
                        setPendingChanges(true) // Allow user to save/reactivate if they want
                      } catch (error) {
                        console.error('Error revoking shared key:', error)
                      }
                    }
                  }}
                  disabled={isRevoking}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: isRevoking ? '#ccc' : '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isRevoking ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {isRevoking ? 'Revoking...' : 'Revoke Shared Key'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#004085', marginBottom: '0.75rem' }}>
                  <strong>No shared key active</strong>
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '0.75rem' }}>
                  Activate a 24-hour shared API key. You'll need to accept the terms and conditions.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  disabled={isActivating}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: isActivating ? '#ccc' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isActivating ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {isActivating ? 'Activating...' : 'Activate 24-Hour Shared Key'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Save button and Google Cloud Console link */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!pendingChanges || (keyType === 'own' && !inputValue.trim()) || isActivating}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: (pendingChanges && (keyType === 'shared' || inputValue.trim())) && !isActivating ? '#0070f3' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (pendingChanges && (keyType === 'shared' || inputValue.trim())) && !isActivating ? 'pointer' : 'not-allowed',
              fontWeight: '500'
            }}
          >
            {isActivating ? 'Activating...' : 'Save Changes'}
          </button>
          {keyType === 'own' && apiKey && (
            <a 
              href="https://console.cloud.google.com/google/maps-apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fff',
                color: '#0070f3',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
                border: '1px solid #0070f3'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6f2ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff'
              }}
            >
              Open Google Cloud Console
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
          {pendingChanges && (
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              You have unsaved changes
            </span>
          )}
        </div>

        {/* Show API Key instructions only when "My Own API Key" is selected */}
        {keyType === 'own' && (
          <div style={{ 
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
            padding: '1.5rem', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: showInstructions ? '1rem' : '0'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.125rem',
                  color: '#004085',
                  fontWeight: '600'
                }}>
                  📚 How to Get Your Google Maps API Key
                </h3>
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'transparent',
                      color: '#0070f3',
                      border: '1px solid #0070f3',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e6f2ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                  </button>
                )}
              </div>
              
              {showInstructions && (
                <>
                  <p style={{
                    marginTop: 0,
                    marginBottom: '1rem',
                    fontSize: '0.8125rem',
                    color: '#6c757d',
                    fontStyle: 'italic'
                  }}>
                    Note: These instructions were generated by AI and may not be 100% accurate. Please refer to the official Google Cloud documentation for the most up-to-date information.
                  </p>
                  
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#004085',
                    lineHeight: '1.6'
                  }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: '0.5rem', 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#004085'
                  }}>
                    Step 1: Create or Select a Google Cloud Project
                  </h4>
                  <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Go to the{' '}
                      <a 
                        href="https://console.cloud.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#0070f3', textDecoration: 'underline' }}
                      >
                        Google Cloud Console
                      </a>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Sign in with your Google account (or create one if you don't have one)
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Click the project dropdown at the top of the page
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Click <strong>"New Project"</strong> to create a new project, or select an existing project
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      If creating a new project, enter a project name (e.g., "My Real Estate App") and click <strong>"Create"</strong>
                    </li>
                  </ol>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: '0.5rem', 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#004085'
                  }}>
                    Step 2: Enable Required APIs
                  </h4>
                  <p style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                    You need to enable the following Google Maps APIs for this application to work:
                  </p>
                  <ul style={{ marginLeft: '1.5rem', marginBottom: '0.75rem' }}>
                    <li style={{ marginBottom: '0.25rem' }}><strong>Maps JavaScript API</strong> - For interactive maps</li>
                    <li style={{ marginBottom: '0.25rem' }}><strong>Geocoding API</strong> - For address lookups</li>
                    <li style={{ marginBottom: '0.25rem' }}><strong>Directions API</strong> - For route directions</li>
                    <li style={{ marginBottom: '0.25rem' }}><strong>Distance Matrix API</strong> - For commute calculations</li>
                    <li style={{ marginBottom: '0.25rem' }}><strong>Places API</strong> - For address autocomplete</li>
                    <li style={{ marginBottom: '0.25rem' }}><strong>Street View Static API</strong> - For street view images</li>
                  </ul>
                  <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Go to the{' '}
                      <a 
                        href="https://console.cloud.google.com/apis/library" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#0070f3', textDecoration: 'underline' }}
                      >
                        API Library
                      </a>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Search for each API name above (e.g., "Maps JavaScript API")
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Click on the API name, then click the <strong>"Enable"</strong> button
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Repeat for all 6 APIs listed above
                    </li>
                  </ol>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: '0.5rem', 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#004085'
                  }}>
                    Step 3: Create API Credentials
                  </h4>
                  <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Go to the{' '}
                      <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#0070f3', textDecoration: 'underline' }}
                      >
                        Credentials page
                      </a>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Click <strong>"+ CREATE CREDENTIALS"</strong> at the top of the page
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Select <strong>"API key"</strong> from the dropdown menu
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Your API key will be created and displayed. <strong>Copy this key immediately</strong> - you won't be able to see it again in full
                    </li>
                  </ol>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: '0.5rem', 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#004085'
                  }}>
                    Step 4: (Recommended) Restrict Your API Key
                  </h4>
                  <p style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                    For security, it's recommended to restrict your API key to only the APIs and websites that need it.
                  </p>
                  <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Click on your newly created API key in the credentials list
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Under <strong>"API restrictions"</strong>, select <strong>"Restrict key"</strong>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Check the boxes for all 6 APIs listed in Step 2
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Under <strong>"Application restrictions"</strong>, you can optionally restrict by:
                      <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li><strong>HTTP referrers</strong> - Add your website domain (e.g., <code style={{ backgroundColor: '#fff', padding: '0.125rem 0.25rem', borderRadius: '2px' }}>yourdomain.com/*</code>)</li>
                        <li><strong>IP addresses</strong> - Add specific IP addresses if known</li>
                      </ul>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      Click <strong>"Save"</strong> to apply restrictions
                    </li>
                  </ol>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    marginTop: 0, 
                    marginBottom: '0.5rem', 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#004085'
                  }}>
                    Step 5: Enter Your API Key
                  </h4>
                  <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    Paste your API key in the field above and click <strong>"Save API Key"</strong>. 
                    Your key will be stored locally in your browser and used for all Google Maps features.
                  </p>
                </div>

                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  border: '1px solid #ffc107'
                }}>
                  <strong style={{ color: '#856404' }}>💡 Important Notes:</strong>
                  <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: '#856404' }}>
                    <li style={{ marginBottom: '0.25rem' }}>
                      Keep your API key secure and don't share it publicly
                    </li>
                    <li style={{ marginBottom: '0.25rem' }}>
                      If you exceed the free tier, you'll be charged based on usage. Monitor your usage in the{' '}
                      <a 
                        href="https://console.cloud.google.com/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#856404', textDecoration: 'underline' }}
                      >
                        Billing section
                      </a>
                    </li>
                    <li style={{ marginBottom: '0.25rem' }}>
                      It may take a few minutes after enabling APIs for them to become active
                    </li>
                  </ul>
                </div>

                  </div>
                </>
              )}
            </div>
        )}
      </div>

      {/* Reset Everything Section */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: isMobile ? '1rem' : '2rem',
        backgroundColor: '#fff3cd',
        marginBottom: isMobile ? '1rem' : '2rem',
        borderColor: '#ffc107'
      }}>
        <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1rem' }}>
          Reset Everything
        </h2>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: isMobile ? '0.875rem' : '0.9375rem' }}>
          This will clear your API key, revoke the 24-hour shared key, clear all site cache, and show the intro modal again. Use this if you want to start fresh.
        </p>
        <button
          type="button"
          onClick={handleResetEverything}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c82333'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc3545'
          }}
        >
          Reset Everything
        </button>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleActivateSharedKey}
      />
    </div>
  )
}

