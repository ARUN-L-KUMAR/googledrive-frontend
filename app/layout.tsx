import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CloudDrive - Secure Cloud Storage',
  description: 'CloudDrive is a secure cloud storage platform. Store, share, and collaborate on your files with bank-grade encryption. Get 5GB free storage to get started.',
  icons: {
    icon: [
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: light)' },
      { url: '/favicon.svg', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [
      { url: '/apple-icon-dark.svg', media: '(prefers-color-scheme: light)' },
      { url: '/apple-icon.png', media: '(prefers-color-scheme: dark)' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

