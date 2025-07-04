// 📁 src/components/dashboard/header.tsx (Mobile-responsive header with online/offline indicator)
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Settings, 
  LogOut, 
  User,
  Shield,
  Wifi,
  WifiOff,
  Plus,
  Menu,
  Check
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePWA } from '@/hooks/usePWA'
import { useNotificationStore } from '@/store/notification'
import { useNotificationListener } from '@/hooks/useNotificationListener'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const { isOnline } = usePWA()
  const { notifications, unreadCount, markAsRead } = useNotificationStore()

  // Hook to listen for new notifications
  useNotificationListener();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Left section: Mobile menu button + App name */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold hidden sm:block">SecurePass</span>
          </div>
        </div>

        {/* Center section: Quick action for larger screens */}
        <div className="flex-1 flex justify-center">
          <Link href="/dashboard/capsules/new" className="hidden md:block">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Capsule
            </Button>
          </Link>
        </div>

        {/* Right section: Status indicators + User menu */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Online/Offline Indicator */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center space-x-1">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="hidden sm:block text-xs text-green-600 font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="hidden sm:block text-xs text-red-600 font-medium">Offline</span>
              </div>
            )}
          </div>

          {/* Notifications */}
          <DropdownMenu onOpenChange={(open) => !open && markAsRead()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.slice(0, 5).map(notif => (
                        <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1">
                            <p className="text-sm font-medium">{notif.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(notif.timestamp)}</p>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={markAsRead} className="flex items-center justify-center">
                    <Check className="mr-2 h-4 w-4" />
                    Mark all as read
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture} alt={user?.displayName} />
                  <AvatarFallback className="bg-gradient-main text-white">
                    {user?.displayName ? getInitials(user.displayName) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/security" className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Security Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="flex items-center text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
