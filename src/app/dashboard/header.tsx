'use client'

import React from 'react' // Import React
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu' // Assuming this is the correct path for your dropdown components
import {
  Bell,
  Settings,
  LifeBuoy,
  LogOut,
  CreditCard,
  User,
  Shield,
  HelpCircle,
  FolderOpen,
  PlusCircle,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth' // Assuming useAuth is in this path
import { toast } from 'sonner' // Assuming sonner is installed for toasts

// You might need a utility for combining class names, e.g., 'clsx' or 'tailwind-merge'
// If you have a 'cn' utility, make sure it's imported or defined.
// For example:
// import { cn } from '@/lib/utils'; // Or wherever your cn utility is

export function Header() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { setTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully!')
      router.push('/auth/signin') // Redirect to sign-in page after logout
    } catch (error: any) {
      console.error('Logout failed:', error)
      toast.error(`Logout failed: ${error.message}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        {/* Left section: App Name/Logo and Navigation Toggle (if applicable) */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="lg:hidden">
            {/* Add a menu icon or toggle for mobile navigation if you have one */}
            <span className="sr-only">Toggle navigation</span>
          </Button>
          <span className="text-xl font-bold">SecureCapsule</span>
        </div>

        {/* Right section: User Menu, Notifications, Theme Toggle */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.imageUrl || '/avatars/01.png'} alt="@shadcn" />
                  <AvatarFallback>
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'SC'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/security')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/capsules/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>New Capsule</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/capsules')}>
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>My Capsules</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/help-center')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}