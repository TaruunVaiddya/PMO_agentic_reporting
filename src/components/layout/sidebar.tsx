"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Plus,
  Search,
  FileText,
  Layers,
  Clock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Settings,
  LogOut,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSession } from '@/contexts/session-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { postFetcher } from '@/lib/post-fetcher'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/fetch-with-auth'

interface AppSidebarProps {
  sessions: any[];
  error: any;
  isLoading: boolean;
  mutate: () => void;
}

export function AppSidebar({
  sessions,
  error,
  isLoading,
  mutate
}: AppSidebarProps) {
  const router = useRouter()
  const { isCollapsed, toggle, expand, collapse } = useSidebar();
  const pathname = usePathname()
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const collapseTimeout = useRef<NodeJS.Timeout | null>(null)

  const { pendingQuery, setPendingQuery, newSessionId, setNewSessionId } = useSession()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  const handleLogout = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST'
      })
      if (response.ok) window.location.href = '/login'
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  const handleMouseEnter = () => {
    if (collapseTimeout.current) clearTimeout(collapseTimeout.current);
    expand();
  };

  const handleMouseLeave = () => {
    collapseTimeout.current = setTimeout(() => {
      collapse();
    }, 200);
  };

  // Helper component for the navigation buttons to ensure consistency
  const NavButton = ({ icon: Icon, label, path, onClick }: any) => {
    const isActive = pathname === path;
    return (
      <button
        onClick={onClick || (() => path && router.push(path))}
        className={cn(
          "flex items-center px-4 py-2.5 rounded-lg mb-2 transition-all duration-300 font-medium w-full cursor-pointer group relative overflow-hidden",
          isActive ? 'bg-white text-[#141c50]' : 'text-white hover:bg-[#25337a]'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className={cn(
          "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed
            ? "max-w-0 opacity-0 ml-0"
            : "max-w-[200px] opacity-100 ml-3"
        )}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "h-screen bg-[#1a2456] flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative border-r border-white/10",
        isCollapsed ? "w-20" : "w-68"
      )}
    >
      {/* Header */}
      <div className="flex items-center h-20 px-4 mb-4">
        <div className={cn(
          "flex items-center w-full transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between px-2"
        )}>
          <h1 className={cn(
            "font-semibold text-white transition-all duration-300 overflow-hidden whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            SDZ Report Builder
          </h1>
          <button
            className="p-1.5 rounded-md hover:bg-[#25337a] text-white/70 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); toggle(); }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3">
        <NavButton
          icon={Layers}
          label="Report Templates"
          path="/report-templates"
        />
        <NavButton
          icon={Plus}
          label="Generate Report"
          path="/chat"
        />
        <NavButton
          icon={Brain}
          label="PMO Intelligence"
          path="/pmo-intelligence"
        />
      </nav>

      {/* Bottom Controls */}
      <div className="px-3 pb-6">
        <NavButton
          icon={Settings}
          label="Settings"
          path="/settings"
        />
        <NavButton
          icon={LogOut}
          label="Logout"
          onClick={handleLogout}
        />

        {/* Logo Container */}
        <div className="mt-6 flex items-center justify-center h-12 relative">
          <img
            src="/SDZlogomark1.svg"
            alt="Logo Small"
            className={cn(
              "absolute transition-all duration-500 transform",
              isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            )}
            style={{ width: 32, height: 32 }}
          />
          <img
            src="/SDZlogo.svg"
            alt="Logo Full"
            className={cn(
              "absolute transition-all duration-500 transform",
              !isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            )}
            style={{ width: 140, height: 'auto' }}
          />
        </div>
      </div>
    </div>
  )
}



