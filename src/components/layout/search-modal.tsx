"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Layers, FileText, MessageSquare, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
// Removed SWR imports - will receive data as props

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  sessions: any[]
  error: any
  isLoading: boolean
}

export function SearchModal({ isOpen, onClose, sessions, error, isLoading }: SearchModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = () => {
    router.push('/chat')
    onClose()
  }

  const handleReports = () => {
    router.push('/reports')
    onClose()
  }

  const handleTemplates = () => {
    router.push('/report-templates')
    onClose()
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-black/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col" style={{ height: '70vh' }}>
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or commands..."
              className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/20 transition-colors"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-4 flex-shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleNewChat}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
            >
              <Plus className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors">New Chat</span>
            </button>

            <button
              onClick={handleTemplates}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
            >
              <Layers className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors">Templates</span>
            </button>

            <button
              onClick={handleReports}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
            >
              <FileText className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              <span className="text-xs text-white/70 group-hover:text-white transition-colors">My Reports</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              {searchQuery ? `Search Results` : `Recent Chats`}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
          <div className="space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                <span className="ml-2 text-sm text-white/40">Loading chats...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-full mb-3">
                  <Search className="h-5 w-5 text-white/40" />
                </div>
                <p className="text-white/40 text-sm">Failed to load chats</p>
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleChatClick(session.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                      <MessageSquare className="h-4 w-4 text-white/60" />
                    </div>
                    <span className="text-sm text-white/80 truncate group-hover:text-white transition-colors" title={session.title}>
                      {session.title}
                    </span>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </span>
                </button>
              ))
            ) : sessions.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-full mb-3">
                  <MessageSquare className="h-5 w-5 text-white/40" />
                </div>
                <p className="text-white/40 text-sm">No recent chats yet. Start a new conversation!</p>
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-full mb-3">
                  <Search className="h-5 w-5 text-white/40" />
                </div>
                <p className="text-white/40 text-sm">No chats found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
