// 📁 src/app/layout.tsx (UPDATED for PWA)
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL}`)
  : 'http://localhost:3000';
  
  export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'SecurePass Capsule - Secure Data Storage',
  description: 'Store and manage your personal data securely with zero-knowledge encryption',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SecurePass Capsule',
    startupImage: [
      '/icons/apple-splash-2048-2732.jpg',
      '/icons/apple-splash-1668-2224.jpg',
      '/icons/apple-splash-1536-2048.jpg',
      '/icons/apple-splash-1125-2436.jpg',
      '/icons/apple-splash-1242-2208.jpg',
      '/icons/apple-splash-750-1334.jpg',
      '/icons/apple-splash-828-1792.jpg',
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#3b82f6' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'SecurePass Capsule',
    title: 'SecurePass Capsule - Secure Data Storage',
    description: 'Store and manage your personal data securely with zero-knowledge encryption',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SecurePass Capsule - Secure Data Storage',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecurePass Capsule - Secure Data Storage',
    description: 'Store and manage your personal data securely with zero-knowledge encryption',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="SecurePass Capsule" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SecurePass" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Preload Critical Resources */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="preload" href="/sw.js" as="script" />
        
        {/* DNS Prefetch for External Resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
