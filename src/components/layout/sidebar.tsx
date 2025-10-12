
"use client"

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Plus,
  Search,
  FileText,
  Layers,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchModal } from './search-modal'

interface AppSidebarProps {
  isCollapsed?: boolean;
}

export function AppSidebar({ isCollapsed = false }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [favoritesExpanded, setFavoritesExpanded] = useState(false)
  const [recentChatsExpanded, setRecentChatsExpanded] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleNewChat = () => {
    router.push('/chat')
  }

  const handleSearch = () => {
    setIsSearchOpen(true)
  }

  const handleReports = () => {
    router.push('/reports')
  }

  const handleTemplates = () => {
    router.push('/report-templates')
  }

  const isInChatSession = pathname?.startsWith('/chat/') || false

  const navItems = [
    { icon: Plus, label: 'New Chat', active: pathname === '/chat', onClick: handleNewChat },
    { icon: Search, label: 'Search', onClick: handleSearch },
    { icon: FileText, label: 'My Reports', active: pathname === '/reports', onClick: handleReports },
    { icon: Layers, label: 'Report Templates', active: pathname === '/report-templates', onClick: handleTemplates },
    { icon: Clock, label: 'Recent Chats', onClick: handleSearch },
  ]

  const recentChats = [
    { id: 'session-1', title: 'Metallic Silver Border Ca...' },
    { id: 'session-2', title: 'Model identification' },
    { id: 'session-3', title: 'Knowledge graph UI' },
    { id: 'session-4', title: 'Glow menu component' },
    { id: 'session-5', title: 'Silver modal design' },
    { id: 'session-6', title: 'Microfinance report' },
    { id: 'session-7', title: 'Greeting' },
    { id: 'session-8', title: 'Next.js login page' },
    { id: 'session-9', title: 'Hello back' },
    { id: 'session-10', title: 'React component optimization' },
    { id: 'session-11', title: 'Database schema design' },
    { id: 'session-12', title: 'API endpoint configuration' },
    { id: 'session-13', title: 'User authentication flow' },
    { id: 'session-14', title: 'Payment gateway integration' },
    { id: 'session-15', title: 'Email notification system' },
    { id: 'session-16', title: 'File upload functionality' },
    { id: 'session-17', title: 'Search and filter implementation' },
    { id: 'session-18', title: 'Dashboard analytics' },
    { id: 'session-19', title: 'Mobile responsive design' },
    { id: 'session-20', title: 'Performance monitoring' },
  ]

  const handleChatClick = (sessionId: string) => {
    router.push(`/chat/${sessionId}`)
  }

  return (
    <div className={cn(
      "h-[calc(100vh-3rem)] bg-background flex flex-col transition-all duration-300 overflow-hidden relative",
      isCollapsed ? "w-16" : "w-64"
    )}>

      {/* Top Navigation */}
      <div className="p-3 mt-2 space-y-1">
        {navItems.map((item, index) => (
          <Button
            key={index}
            variant={item.active ? "secondary" : "ghost"}
            size="sm"
            onClick={item.onClick}
            className={cn(
              " text-sm font-medium transition-colors cursor-pointer",
              isCollapsed ? "w-8 px-0 justify-center" : "w-full justify-start px-3",
              item.active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </Button>
        ))}
      </div>

      {!isCollapsed && (
        <>
          {/* Favorites Section */}
          <div className="px-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              className="w-full justify-between h-8 px-2 text-sm font-medium text-muted-foreground/80 hover:text-muted-foreground tracking-wide"
            >
              <span>Favorites</span>
              {favoritesExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {favoritesExpanded && (
              <div className=" border border-dashed border-border rounded-lg p-4">
                <div className="text-center text-xs text-muted-foreground/70">
                  Favorite chats and projects that you use often.
                </div>
              </div>
            )}
          </div>

          {/* Recent Chats Section */}
          <div className="px-3 mt-6 flex-1 flex flex-col overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRecentChatsExpanded(!recentChatsExpanded)}
              className="w-full justify-between h-8 px-2 text-sm font-medium text-muted-foreground/80 hover:text-muted-foreground tracking-wide flex-shrink-0"
            >
              <span>Recent Chats</span>
              {recentChatsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {recentChatsExpanded && (
              <div className="mb-3 mt-2 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  {recentChats.map((chat) => {
                    const isActive = pathname === `/chat/${chat.id}`
                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleChatClick(chat.id)}
                        className={cn(
                          "group flex items-center justify-between px-3 py-1 rounded-md text-sm transition-colors cursor-pointer",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <span className="truncate flex-1">{chat.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}
