import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import StageGate from '@/components/StageGate'
import ApiKeyBanner from '@/components/ApiKeyBanner'
import IntroModal from '@/components/IntroModal'
import WizardOnboardingModal from '@/components/WizardOnboardingModal'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { WizardProvider } from '@/contexts/WizardContext'

export const metadata: Metadata = {
  title: 'Real Estate App',
  description: 'Real estate application',
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
    </>
  )
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
          <WizardProvider>
            <LayoutContent>{children}</LayoutContent>
          </WizardProvider>
        </ApiKeyProvider>
      </body>
    </html>
  )
}
