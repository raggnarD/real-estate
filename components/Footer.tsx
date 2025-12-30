'use client'

import { useState, useEffect } from 'react'

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <footer
      style={{
        width: '100%',
        padding: isMobile ? '1rem' : '1.5rem 2rem',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e0e0e0',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '1rem' : '0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '0.875rem',
        color: '#666',
      }}
    >
      <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
        Created By: <strong style={{ color: '#000' }}>James Kocher</strong>
      </div>
      <a
        href="https://www.jameskocher.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#0070f3',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          transition: 'background-color 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0051cc'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0070f3'
        }}
      >
        Contact
      </a>
    </footer>
  )
}

