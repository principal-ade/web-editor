'use client'

import { ThemeProvider } from '@a24z/industry-theme'
import { defaultTheme } from 'themed-markdown'
import { ReactNode } from 'react'

export function ThemeWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>
}
