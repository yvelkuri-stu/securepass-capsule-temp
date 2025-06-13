// 📁 src/app/dashboard/demo/page.tsx (NEW - Demo Page)
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Users, Zap } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Encryption',
    description: 'Your data is encrypted on your device before it ever touches the cloud. We can\'t see it, and neither can anyone else.',
    color: 'text-green-500'
  },
  {
    icon: Lock,
    title: 'Capsule Password Protection',
    description: 'Add an extra layer of security to individual capsules with a password. Perfect for your most sensitive information.',
    color: 'text-blue-500'
  },
  {
    icon: Zap,
    title: 'AI-Powered Organization',
    description: 'Our AI analyzes your content to suggest tags, categories, and security levels, making organization effortless.',
    color: 'text-yellow-500'
  },
    {
    icon: Users,
    title: 'Secure Sharing',
    description: 'Share capsules with others using granular permissions and time-based access controls. Revoke access at any time.',
    color: 'text-purple-500'
  }
]

export default function DemoPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold">App Demo</h1>
        <p className="text-muted-foreground mt-2">
          Explore the core features of SecurePass Capsule.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <feature.icon className={`h-8 w-8 ${feature.color} mb-2`} />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      <div className="text-center">
        <Link href="/auth/register">
            <Button size="lg">
                Get Started and Secure Your Data
            </Button>
        </Link>
      </div>
    </motion.div>
  )
}
