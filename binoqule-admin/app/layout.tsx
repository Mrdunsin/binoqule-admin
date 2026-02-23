import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Binoqule Admin',
  description: 'Content management system for Binoqule TMT newsletter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
