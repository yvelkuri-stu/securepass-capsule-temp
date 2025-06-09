// 📁 src/components/dashboard/sidebar.tsx (Mobile-responsive sidebar)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  Plus,
  Menu,
  X
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
   {
    name: 'Security',
    href: '/dashboard/security',
    icon: Shield,
  },
]

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(false) // Don't collapse on mobile, use overlay instead
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarContent = (
    <>
      {/* Logo & Collapse Button */}
      <div className="p-4 flex items-center justify-between">
        {(!collapsed || isMobile) && (
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
        
        {!isMobile && (
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
        )}

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="text-primary-foreground hover:bg-primary/20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Quick Action */}
      <div className="p-4">
        <Link href="/dashboard/capsules/new">
          <Button 
            className={cn(
              "w-full justify-start bg-gradient-accent hover:opacity-90",
              (collapsed && !isMobile) && "justify-center"
            )}
          >
            <Plus className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="ml-2">New Capsule</span>}
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
                  (collapsed && !isMobile) && "justify-center",
                  isActive && "bg-primary/30 text-primary-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {(!collapsed || isMobile) && <span className="ml-2">{item.name}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>
    </>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-background border shadow-md"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 h-full w-80 bg-gradient-dark border-r border-border/50 flex flex-col z-50 md:hidden"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-gradient-dark border-r border-border/50 flex flex-col hidden md:flex"
    >
      {sidebarContent}
    </motion.div>
  )
}
