'use client'

import { useState, useEffect } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'

export default function AccountPage() {
  const { apiKey, setApiKey, isDemoMode, forceDemoMode } = useApiKey()
  const [inputValue, setInputValue] = useState(apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim())
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
    setSaveMessage('API key cleared')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // Update input value when apiKey changes externally
  useEffect(() => {
    setInputValue(apiKey || '')
  }, [apiKey])

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem'
    }}>
      <h1 style={{ marginTop: 0, color: '#000', marginBottom: '1rem' }}>
        Account Settings
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Manage your Google Maps API key and account preferences.
      </p>

      {/* Warning callout if user tried to turn off demo mode without API key */}
      {forceDemoMode && !apiKey && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '1rem', 
              color: '#856404',
              marginBottom: '0.5rem'
            }}>
              API Key Required to Disable Demo Mode
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#856404',
              lineHeight: '1.5'
            }}>
              You need to enter a valid Google Maps API key below to turn off demo mode. 
              Demo mode is currently active because no API key is set.
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '2rem',
        backgroundColor: '#f9f9f9',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, color: '#000', marginBottom: '1.5rem' }}>
          Google Maps API Key
        </h2>

        {isDemoMode && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <strong>Demo Mode Active</strong>
            <div style={{ marginTop: '0.5rem', color: '#856404' }}>
              {apiKey 
                ? 'You have an API key saved, but demo mode is currently enabled. Toggle demo mode off in the navigation to use your API key.'
                : 'No API key is set. Enter your Google Maps API key below to enable full functionality.'}
            </div>
          </div>
        )}

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

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!inputValue.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: inputValue.trim() ? '#0070f3' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              fontWeight: '500'
            }}
          >
            Save API Key
          </button>
          {apiKey && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Clear API Key
            </button>
          )}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '8px',
          border: '1px solid #b3d9ff'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '0.5rem', 
            fontSize: '1.125rem',
            color: '#004085',
            fontWeight: '600'
          }}>
            📚 How to Get Your Google Maps API Key
          </h3>
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

            <div style={{ 
              marginTop: '1.5rem',
              textAlign: 'center'
            }}>
              <a 
                href="https://console.cloud.google.com/google/maps-apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0056b3'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0070f3'
                }}
              >
                Open Google Cloud Console →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

