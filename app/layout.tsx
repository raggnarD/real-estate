import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import StageGate from '@/components/StageGate'
import ApiKeyBanner from '@/components/ApiKeyBanner'
import IntroModal from '@/components/IntroModal'
import WizardOnboardingModal from '@/components/WizardOnboardingModal'
import Footer from '@/components/Footer'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { WizardProvider } from '@/contexts/WizardContext'

export const metadata: Metadata = {
  title: 'RushRoost',
  description: 'Real estate application',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/rushroost-logo.png',
  },
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntroModal />
      <WizardOnboardingModal />
      <ApiKeyBanner />
      <Navigation />
      <StageGate />
      {children}
      <Footer />
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#fff',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}>
        <ApiKeyProvider>
          <WizardProvider>
            <LayoutContent>{children}</LayoutContent>
          </WizardProvider>
        </ApiKeyProvider>
      </body>
    </html>
  )
}
