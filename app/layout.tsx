import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'

export const metadata: Metadata = {
  title: 'Real Estate App',
  description: 'Real estate application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#fff',
        color: '#000'
      }}>
        <ApiKeyProvider>
          <Navigation />
          {children}
        </ApiKeyProvider>
      </body>
    </html>
  )
}
