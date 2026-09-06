import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import '../index.css'

export const metadata: Metadata = {
  title: 'Aegis AI — Network Intrusion Detection System',
  description: 'Native desktop Network Intrusion Detection System with deterministic stateful flow analysis and threat heuristics.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ backgroundColor: '#0c0e12' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
