
// 📁 src/components/landing/landing-page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Lock, 
  Smartphone, 
  Cloud, 
  Zap, 
  Users,
  ChevronRight,
  Star,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const features = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Encryption',
    description: 'Your data is encrypted client-side. We never see your information.',
    color: 'text-green-500'
  },
  {
    icon: Lock,
    title: 'Multi-Factor Security',
    description: 'Biometric, hardware keys, and TOTP authentication options.',
    color: 'text-blue-500'
  },
  {
    icon: Smartphone,
    title: 'Cross-Platform PWA',
    description: 'Works seamlessly on desktop, mobile, and tablet devices.',
    color: 'text-purple-500'
  },
  {
    icon: Cloud,
    title: 'Secure Cloud Sync',
    description: 'Encrypted synchronization across all your devices.',
    color: 'text-teal-500'
  },
  {
    icon: Zap,
    title: 'AI-Powered Organization',
    description: 'Smart categorization and intelligent content management.',
    color: 'text-yellow-500'
  },
  {
    icon: Users,
    title: 'Secure Sharing',
    description: 'Share with granular permissions and time-locked access.',
    color: 'text-red-500'
  }
]

export function LandingPage() {
  const { isAuthenticated, redirectIfAuthenticated } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    redirectIfAuthenticated()
  }, [redirectIfAuthenticated])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">SecurePass Capsule</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="gradient">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Zero-Knowledge Security
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Your Personal Data
            <br />
            <span className="text-foreground">Vault in the Cloud</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Store, organize, and share your sensitive data with military-grade encryption. 
            AI-powered organization meets bulletproof security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Securing Your Data
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose SecurePass Capsule?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the perfect blend of security, usability, and intelligence in personal data management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <feature.icon className={`h-8 w-8 ${feature.color} mb-2`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Promise */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Our Security Promise</h2>
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span>Client-side encryption only</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span>Zero server-side data access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span>Open source components</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Digital Life?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who trust SecurePass Capsule with their most sensitive data.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="gradient" className="animate-pulse-glow">
              Create Your Free Account
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">SecurePass Capsule</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 SecurePass Capsule. Your data, your control.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}