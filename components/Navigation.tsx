'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #ddd',
      padding: '1rem 2rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link 
          href="/"
          style={{
            textDecoration: 'none',
            color: pathname === '/' ? '#0070f3' : '#333',
            fontWeight: pathname === '/' ? '600' : '400',
            fontSize: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            transition: 'all 0.2s',
            backgroundColor: pathname === '/' ? '#e6f2ff' : 'transparent'
          }}
        >
          ⏱️ True Commute Time
        </Link>
        <Link 
          href="/neighborhood-finder"
          style={{
            textDecoration: 'none',
            color: pathname === '/neighborhood-finder' ? '#0070f3' : '#333',
            fontWeight: pathname === '/neighborhood-finder' ? '600' : '400',
            fontSize: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            transition: 'all 0.2s',
            backgroundColor: pathname === '/neighborhood-finder' ? '#e6f2ff' : 'transparent'
          }}
        >
          🧭 Neighborhood Finder
        </Link>
      </div>
    </nav>
  )
}

