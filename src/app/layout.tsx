import type { Metadata } from 'next'
import './globals.css'
import { ThemeWrapper } from '@/components/ThemeWrapper'

export const metadata: Metadata = {
  title: 'Web Editor',
  description: 'A web-based code editor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
