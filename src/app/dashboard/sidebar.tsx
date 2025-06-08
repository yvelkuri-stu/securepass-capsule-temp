
// 📁 src/components/dashboard/sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  LayoutDashboard, 
  Archive, 
  Share2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Capsules',
    href: '/dashboard/capsules',
    icon: Archive,
  },
  {
    name: 'Shared With Me',
    href: '/dashboard/shared',
    icon: Share2,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-gradient-dark border-r border-border/50 flex flex-col"
    >
      {/* Logo & Collapse Button */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-primary-foreground">SecurePass</span>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-primary-foreground hover:bg-primary/20"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator className="bg-border/50" />

      {/* Quick Action */}
      <div className="p-4">
        <Link href="/dashboard/capsules/new">
          <Button 
            className={cn(
              "w-full justify-start bg-gradient-accent hover:opacity-90",
              collapsed && "justify-center"
            )}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && <span className="ml-2">New Capsule</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/20",
                  collapsed && "justify-center",
                  isActive && "bg-primary/30 text-primary-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{item.name}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>
    </motion.div>
  )
}
