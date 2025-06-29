// 📁 src/app/layout.tsx (UPDATED for PWA)
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SecurePass Capsule',
  description: 'Secure personal data storage with zero-knowledge encryption',
  keywords: ['security', 'encryption', 'privacy', 'storage', 'capsule'],
  authors: [{ name: 'SecurePass Team' }],
  creator: 'SecurePass',
  publisher: 'SecurePass',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari_pinned_tab_svg.svg', color: '#3b82f6' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SecurePass',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'SecurePass Capsule',
    title: 'SecurePass Capsule - Secure Personal Data Storage',
    description: 'Store your personal data securely with zero-knowledge encryption',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecurePass Capsule',
    description: 'Secure personal data storage with zero-knowledge encryption',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Remove service worker preload link */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SecurePass" />
        <meta name="application-name" content="SecurePass" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            duration={4000}
          />
        </Providers>
      </body>
    </html>
  )
}