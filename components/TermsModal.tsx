'use client'

import { useState } from 'react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleAccept = async () => {
    if (accepted && !isProcessing) {
      setIsProcessing(true)
      try {
        await onAccept()
        setAccepted(false)
        // Modal will be closed by parent component on success
      } catch (error) {
        // Error handling is done in the parent component
        // Don't close modal on error so user can see what went wrong
        console.error('Error accepting terms:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleClose = () => {
    setAccepted(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} onClick={handleClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid #ddd'
        }}>
          <h2 style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#000'
          }}>
            Terms and Conditions
          </h2>
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            color: '#666'
          }}>
            Please read and accept the following terms to use the 24-hour shared API key.
          </p>
        </div>

        <div style={{
          padding: '2rem',
          maxHeight: '50vh',
          overflow: 'auto',
          fontSize: '0.875rem',
          lineHeight: '1.6',
          color: '#333'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#000'
          }}>
            Fair Use Policy
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            By using the 24-hour shared API key, you agree to the following terms:
          </p>
          
          <ul style={{
            marginLeft: '1.5rem',
            marginBottom: '1.5rem',
            paddingLeft: 0
          }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Fair Use:</strong> You agree to use this service responsibly and in accordance with 
              Google Maps Platform Terms of Service. Excessive or abusive usage is prohibited.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>No Exploitation:</strong> You must not attempt to exploit, abuse, or circumvent the 
              24-hour limitation or rate limits. Automated scripts or bots designed to abuse the service are strictly prohibited.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Rate Limiting:</strong> The shared API key is subject to rate limiting. Excessive 
              requests may result in temporary or permanent access restrictions.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>24-Hour Expiration:</strong> The shared API key expires after 24 hours. You must 
              re-activate and accept these terms to continue using the shared key after expiration.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Data Usage:</strong> Your usage of the shared API key may be monitored for abuse 
              prevention and service improvement purposes.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>No Guarantee:</strong> The shared API key is provided as-is without warranty. 
              Service availability and performance are not guaranteed.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <strong>Termination:</strong> We reserve the right to revoke access to the shared API key 
              at any time for violations of these terms or for any other reason.
            </li>
          </ul>

          <div style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#856404' }}>Important:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#856404' }}>
              For production use or extended access, we strongly recommend obtaining your own Google Maps API key. 
              The shared key is intended for testing and evaluation purposes only.
            </p>
          </div>
        </div>

        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            flex: 1,
            minWidth: '200px'
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#333' }}>
              I have read and agree to the terms and conditions
            </span>
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted || isProcessing}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                backgroundColor: (accepted && !isProcessing) ? '#0070f3' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: (accepted && !isProcessing) ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              {isProcessing ? 'Activating...' : 'Accept & Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

