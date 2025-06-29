//src/components/dashboard/sidebar.tsx
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

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'My Capsules',
      href: '/dashboard/capsules',
      icon: Archive,
    },
    {
      title: 'Shared',
      href: '/dashboard/shared',
      icon: Share2,
    },
    {
      title: 'Security',
      href: '/dashboard/security',
      icon: Shield,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ]

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768)
    if (window.innerWidth >= 768) {
      setIsMobileMenuOpen(false)
    }
  }

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 md:hidden bg-background border shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Mobile Sidebar */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  "fixed left-0 top-0 z-50 h-full w-72 bg-background border-r shadow-lg md:hidden",
                  "flex flex-col",
                  className
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">SecurePass</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* New Capsule Button */}
                <div className="p-4">
                  <Button asChild className="w-full">
                    <Link href="/dashboard/capsules/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Capsule
                    </Link>
                  </Button>
                </div>

                <Separator />

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start',
                          isActive && 'bg-secondary font-medium'
                        )}
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className="mr-3 h-4 w-4" />
                          {item.title}
                        </Link>
                      </Button>
                    )
                  })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    SecurePass Capsule v1.0
                  </p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full bg-background border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">SecurePass</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Capsule Button */}
      <div className="p-4">
        <Button asChild className={cn('w-full', isCollapsed && 'px-2')}>
          <Link href="/dashboard/capsules/new">
            <Plus className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && 'New Capsule'}
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <motion.div
              key={item.href}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary font-medium',
                  isCollapsed && 'px-2'
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-3')} />
                  {!isCollapsed && item.title}
                </Link>
              </Button>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            SecurePass Capsule v1.0
          </p>
        </div>
      )}
    </aside>
  )
}