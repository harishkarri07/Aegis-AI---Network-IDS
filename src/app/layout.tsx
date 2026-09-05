import type { Metadata } from 'next'
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
      <head>
        {process.env.NODE_ENV === 'production' && <base href="./" />}
      </head>
      <body style={{ backgroundColor: '#0a0e1a' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
