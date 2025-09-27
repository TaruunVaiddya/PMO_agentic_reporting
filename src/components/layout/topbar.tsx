"use client"

import { Settings, LogOut, UserIcon, CreditCard, Library, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { OnboardingModal } from '@/components/onboarding-modal'

interface UserResponse {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
  is_first_time:boolean
}

export default function Topbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: 'include'
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)

          // Show onboarding modal if first time user with 2 second delay
          if (userData.is_first_time) {
            setTimeout(() => {
              setShowOnboarding(true)
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Redirect to login or home page after successful logout
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Failed to logout:', error)
      setLoggingOut(false)
    }
  }

  const userEmail = user?.email || "user@example.com"
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <>
      <OnboardingModal 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding} 
      />
      
      <div className="bg-transparent w-full h-12 flex items-center justify-between px-4 dark">
        <div>
          <span className="text-lg font-semibold">DataReports </span>
          <span className='text-xs font-medium text-white/60'>By</span>
          <span className='text-xs font-semibold text-white/60'> Grayold labs</span>
        </div>
        

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/chat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 transition-all duration-200 cursor-pointer ${
            pathname === '/chat'
              ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-blue-500/30'
              : 'bg-gradient-to-r from-zinc-900/50 to-slate-900/50 hover:from-zinc-800/60 hover:to-slate-800/60'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${pathname === '/chat' ? 'text-blue-400' : 'text-slate-300'}`} />
          <span className={`text-sm font-medium ${pathname === '/chat' ? 'text-blue-400' : 'text-slate-300'}`}>Chat</span>
        </button>

        <button
          onClick={() => router.push('/library')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 transition-all duration-200 cursor-pointer ${
            pathname?.startsWith('/library')
              ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-blue-500/30'
              : 'bg-gradient-to-r from-zinc-900/50 to-slate-900/50 hover:from-zinc-800/60 hover:to-slate-800/60'
          }`}
        >
          <Library className={`w-4 h-4 ${pathname?.startsWith('/library') ? 'text-blue-400' : 'text-slate-300'}`} />
          <span className={`text-sm font-medium ${pathname?.startsWith('/library') ? 'text-blue-400' : 'text-slate-300'}`}>Library</span>
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-gradient-to-tl from-card/60 to-white/30 text-white flex items-center justify-center text-sm font-medium hover:from-card/40 hover:to-white/40 transition-all duration-200 border border-white/20 cursor-pointer">
              {loading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                userInitial
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 dark " align="end">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                {userEmail}
              </div>
              
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <UserIcon className="h-4 w-4" />
                Profile
              </button>
              
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              
              <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Subscription
              </button>
              
              <div className="border-t pt-1 mt-1">
                <button 
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-red-600 
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loggingOut ? (
                    <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
    </>
  )
}
