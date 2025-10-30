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
  MoreHorizontal,
  Loader2,
  Edit2,
  Star,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchModal } from './search-modal'
import { useSession } from '@/contexts/session-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { postFetcher } from '@/lib/post-fetcher'
import { toast } from 'sonner'

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
  const { isCollapsed, toggle } = useSidebar();
  const pathname = usePathname()
  const [favoritesExpanded, setFavoritesExpanded] = useState(false)
  const [recentChatsExpanded, setRecentChatsExpanded] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string, title: string } | null>(null)
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Get session context for pending queries
  const { pendingQuery, setPendingQuery, newSessionId, setNewSessionId } = useSession()

  // Close dropdown when clicking outside
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

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingSessionId])

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


  const navItems = [
    { icon: Plus, label: 'New Chat', active: pathname === '/chat', onClick: handleNewChat },
    { icon: Search, label: 'Search', onClick: handleSearch },
    { icon: FileText, label: 'My Reports', active: pathname === '/reports', onClick: handleReports },
    { icon: Layers, label: 'Report Templates', active: pathname === '/report-templates', onClick: handleTemplates },
    { icon: Clock, label: 'Recent Chats', onClick: handleSearch },
  ]

  // Filter sessions into favorites and recent
  const favoriteSessions = sessions.filter((session: any) => session.is_favorite === true)
  const recentSessions = sessions.filter((session: any) => !session.is_favorite)

  const handleChatClick = (sessionId: string) => {
    router.push(`/chat/${sessionId}`)
  }

  const handleEditName = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId)
    setEditingTitle(currentName)
    setOpenDropdownId(null)
  }

  const handleSaveRename = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Session name cannot be empty')
      return
    }

    setIsRenaming(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rename_session`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          title: editingTitle.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to rename session')
      }

      toast.success('Session renamed successfully')
      mutate() // Refresh sessions list
      setEditingSessionId(null)
      setEditingTitle('')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to rename session')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const handleToggleFavorite = async (sessionId: string, currentIsFavorite: boolean) => {
    setOpenDropdownId(null)
    setTogglingFavoriteId(sessionId)

    const newIsFavorite = !currentIsFavorite

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/toggle_favorite`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          is_favorite: newIsFavorite
        })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      toast.success(newIsFavorite ? 'Added to favorites' : 'Removed from favorites')
      mutate() // Refresh sessions list
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update favorite status')
    } finally {
      setTogglingFavoriteId(null)
    }
  }

  const handleDeleteSession = (sessionId: string, sessionTitle: string) => {
    setSessionToDelete({ id: sessionId, title: sessionTitle })
    setShowDeleteConfirm(true)
    setOpenDropdownId(null)
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return

    setDeletingSessionId(sessionToDelete.id)
    setShowDeleteConfirm(false)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete session')
      }

      toast.success('Session deleted successfully')

      // If we're currently viewing the deleted session, redirect to chat home
      if (pathname === `/chat/${sessionToDelete.id}`) {
        router.push('/chat')
      }

      mutate() // Refresh sessions list
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete session')
    } finally {
      setDeletingSessionId(null)
      setSessionToDelete(null)
    }
  }

  const cancelDeleteSession = () => {
    setShowDeleteConfirm(false)
    setSessionToDelete(null)
  }

  // Handle pending query and create session with generated title
  useEffect(() => {
    if (pendingQuery && newSessionId.current) {
      const createSessionWithTitle = async () => {
        try {
          console.log('Creating session with title:', pendingQuery);
          console.log('Session ID:', newSessionId.current);
          
          // Call backend API to create session with generated title
          const response = await postFetcher('/create-title', {
            query: pendingQuery,
            session_id: newSessionId.current
          });
          
          console.log('Session created:', response);
          
          // Force immediate refresh of sessions list
          mutate();
          
        } catch (error) {
          console.error('Error creating session:', error);
        } finally {
          // Clear the context after processing
          setPendingQuery(null);
          setNewSessionId(null);
        }
      };

      createSessionWithTitle();
    }
  }, [pendingQuery]);

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && sessionToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-popover border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Session</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete "{sessionToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={cancelDeleteSession}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSession}
                className="text-sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <span>Favorites {favoriteSessions.length > 0 && `(${favoriteSessions.length})`}</span>
              {favoritesExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {favoritesExpanded && (
              <div className="mt-2">
                {favoriteSessions.length === 0 ? (
                  <div className="border border-dashed border-border rounded-lg p-4">
                    <div className="text-center text-xs text-muted-foreground/70">
                      No favorite chats yet. Star a chat to add it here.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {favoriteSessions.map((session: any) => {
                      const isActive = pathname === `/chat/${session.id}`
                      const isDropdownOpen = openDropdownId === session.id
                      const isEditing = editingSessionId === session.id
                      const isDeleting = deletingSessionId === session.id
                      const isTogglingFavorite = togglingFavoriteId === session.id

                      return (
                        <div
                          key={session.id}
                          onClick={() => !isEditing && !isDeleting && !isTogglingFavorite && handleChatClick(session.id)}
                          className={cn(
                            "group flex items-center justify-between px-3 py-1 rounded-md text-sm transition-colors relative",
                            !isEditing && !isDeleting && !isTogglingFavorite && "cursor-pointer",
                            (isDeleting || isTogglingFavorite) && "opacity-50 pointer-events-none",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {(isDeleting || isTogglingFavorite) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md z-10">
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveRename(session.id)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit()
                                  }
                                }}
                                disabled={isRenaming}
                                className="flex-1 px-2 py-0.5 text-sm bg-background border border-border rounded focus:outline-none focus:border-primary text-foreground"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveRename(session.id)}
                                disabled={isRenaming}
                                className="h-5 w-5"
                              >
                                {isRenaming ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={isRenaming}
                                className="h-5 w-5"
                              >
                                <XCircle className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Star className="h-3 w-3 mr-2 flex-shrink-0 fill-yellow-500 text-yellow-500" />
                              <span className="truncate flex-1" title={session.title}>
                                {session.title}
                              </span>
                            </>
                          )}

                          {!isEditing && (
                            <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdownId(isDropdownOpen ? null : session.id)
                                }}
                                className={cn(
                                  "h-6 w-6 transition-opacity",
                                  isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>

                              {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditName(session.id, session.title)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    Edit name
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFavorite(session.id, true)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                                  >
                                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                    Remove from favorites
                                  </button>

                                  <div className="my-1 h-px bg-border" />

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSession(session.id, session.title)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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
              <span>Recent Chats {recentSessions.length > 0 && `(${recentSessions.length})`}</span>
              {recentChatsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {recentChatsExpanded && (
              <div className="mb-3 mt-2 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading chats...</span>
                    </div>
                  ) : error ? (
                    <div className="px-3 py-2 text-sm text-destructive">
                      Failed to load chats
                    </div>
                  ) : recentSessions.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <div className="text-xs text-muted-foreground/70">
                        No recent chats yet. Start a new conversation!
                      </div>
                    </div>
                  ) : (
                    recentSessions.map((session: any) => {
                      const isActive = pathname === `/chat/${session.id}`
                      const isFavorite = session.is_favorite || false
                      const isDropdownOpen = openDropdownId === session.id
                      const isEditing = editingSessionId === session.id
                      const isDeleting = deletingSessionId === session.id
                      const isTogglingFavorite = togglingFavoriteId === session.id

                      return (
                        <div
                          key={session.id}
                          onClick={() => !isEditing && !isDeleting && !isTogglingFavorite && handleChatClick(session.id)}
                          className={cn(
                            "group flex items-center justify-between px-3 py-1 rounded-md text-sm transition-colors relative",
                            !isEditing && !isDeleting && !isTogglingFavorite && "cursor-pointer",
                            (isDeleting || isTogglingFavorite) && "opacity-50 pointer-events-none",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {(isDeleting || isTogglingFavorite) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md z-10">
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveRename(session.id)
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit()
                                  }
                                }}
                                disabled={isRenaming}
                                className="flex-1 px-2 py-0.5 text-sm bg-background border border-border rounded focus:outline-none focus:border-primary text-foreground"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveRename(session.id)}
                                disabled={isRenaming}
                                className="h-5 w-5"
                              >
                                {isRenaming ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={isRenaming}
                                className="h-5 w-5"
                              >
                                <XCircle className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <span className="truncate flex-1" title={session.title}>
                              {session.title}
                            </span>
                          )}

                          {!isEditing && (
                            <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdownId(isDropdownOpen ? null : session.id)
                                }}
                                className={cn(
                                  "h-6 w-6 transition-opacity",
                                  isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>

                            {isDropdownOpen && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditName(session.id, session.title)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Edit name
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleFavorite(session.id, isFavorite)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                                >
                                  <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-500 text-yellow-500")} />
                                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                </button>

                                <div className="my-1 h-px bg-border" />

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteSession(session.id, session.title)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        sessions={sessions}
        error={error}
        isLoading={isLoading}
      />
      </div>
    </>
  )
}
