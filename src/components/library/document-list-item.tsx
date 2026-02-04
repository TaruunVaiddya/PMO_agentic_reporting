import { FileText, FileSpreadsheet, MoreVertical, Clock, CheckCircle, AlertCircle, Loader2, AlertTriangle, BarChart3, PieChart, TrendingUp, Database, Brain, FileBarChart, Activity, Target, Zap, Sparkles, RotateCcw, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date-utils'
import { useRouter } from 'next/navigation'
import { postFetcher } from '@/lib/post-fetcher'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/fetch-with-auth'

interface DocumentListItemProps {
  documentId: string
  documentName: string
  documentType: string
  processingStatus: 'NOT_STARTED' | 'IN_QUEUE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  percentageCompletion: number
  documentSize: number
  uploadDate: string
  userSuggestion?: string | null
  onClick?: () => void
  onDigest?: (documentId: string) => void
  onDelete?: (documentId: string) => void
}

export function DocumentListItem({
  documentId,
  documentName,
  documentType,
  processingStatus,
  percentageCompletion,
  documentSize,
  uploadDate,
  userSuggestion,
  onClick,
  onDigest,
  onDelete
}: DocumentListItemProps) {
  const router = useRouter()
  const [isDigesting, setIsDigesting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleDeleteClick = async () => {
    setShowDeleteConfirm(false)
    setShowDropdown(false)
    setIsDeleting(true)

    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      toast.success('Document deleted successfully')
      // Optimistically update the UI by removing the document
      onDelete?.(documentId)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete document')
      setIsDeleting(false)
    }
  }

  const handleDigestClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click and side window from opening

    setIsDigesting(true)
    try {
      await postFetcher('/documents/digest', {
        document_id: documentId,
        document_type: documentType
      })

      // Only update status to IN_QUEUE if API succeeds
      onDigest?.(documentId)
      toast.success('Document digest started successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to start document digest')
      // Don't call onDigest if it fails, so the item stays in current state
    } finally {
      setIsDigesting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'NOT_STARTED':
        return <Clock className="w-3 h-3 text-white/60" />
      case 'IN_QUEUE':
        return <Clock className="w-3 h-3 text-yellow-500" />
      case 'PROCESSING':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'FAILED':
        return <AlertCircle className="w-3 h-3 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (processingStatus) {
      case 'NOT_STARTED':
        return 'Not Started'
      case 'IN_QUEUE':
        return 'In Queue'
      case 'PROCESSING':
        const percentage = Math.max(0, Math.min(100, percentageCompletion || 0))
        return `Processing ${percentage.toFixed(0)}%`
      case 'COMPLETED':
        return 'Completed'
      case 'FAILED':
        return 'Failed'
    }
  }


  const getRandomIcon = () => {
    const icons = [
      FileText, FileSpreadsheet, BarChart3, PieChart, TrendingUp,
      Database, Brain, FileBarChart, Activity, Target, Zap
    ]

    // Simple random selection based on array length
    const iconIndex = Math.floor(Math.random() * icons.length)
    return icons[iconIndex]
  }

  const handleItemClick = () => {
    if (documentType === 'Excel') {
      // Store document data in sessionStorage for instant display
      sessionStorage.setItem(`doc_${documentId}`, JSON.stringify({
        document_id: documentId,
        document_name: documentName,
        document_size: documentSize,
        upload_date: uploadDate,
        document_type: documentType
      }))
      router.push(`/library/${documentId}`)
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-white/90 mb-2">Delete Document</h3>
            <p className="text-sm text-white/60 mb-6">
              Are you sure you want to delete "{documentName}"? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(false)
                }}
                className="px-4 py-2 text-sm text-white/80 hover:text-white/90 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteClick()
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        onClick={handleItemClick}
        className={`group p-3 bg-card hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer relative ${
          isDeleting ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {/* Deleting Overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
              <span className="text-xs text-white/80">Deleting...</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
            {(() => {
              const IconComponent = getRandomIcon()
              return <IconComponent className="w-5 h-5 text-white/60" />
            })()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-white/90 truncate" title={documentName}>
                {documentName || 'Untitled Document'}
              </h3>
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                documentType === 'Excel'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : documentType === 'PDF'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-500/20 text-white/60 border border-slate-500/30'
              }`}>
                {documentType || 'File'}
              </span>
            </div>
            <p className="text-xs text-white/50">{formatFileSize(documentSize)}</p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-xs text-white/50">{formatRelativeTime(uploadDate)}</span>

            {processingStatus === 'NOT_STARTED' ? (
              <div className="relative group">
                <button
                  onClick={handleDigestClick}
                  disabled={isDigesting}
                  className="relative flex items-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-300 text-xs font-medium text-white/80 hover:text-blue-400 cursor-pointer border border-white/10 hover:border-white/20 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.12) 50%, rgba(29,78,216,0) 100%)"
                    }}
                  />
                  {isDigesting ? (
                    <Loader2 className="w-3 h-3 relative z-10 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 relative z-10" />
                  )}
                  <span className="relative z-10">
                    {isDigesting ? 'Starting...' : 'Digest'}
                  </span>
                </button>
              </div>
            ) : processingStatus === 'FAILED' ? (
              <div className="relative group">
                <button
                  onClick={handleDigestClick}
                  disabled={isDigesting}
                  className="relative flex items-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-300 text-xs font-medium text-white/80 hover:text-red-400 cursor-pointer border border-white/10 hover:border-white/20 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(220,38,38,0.12) 50%, rgba(185,28,28,0) 100%)"
                    }}
                  />
                  {isDigesting ? (
                    <Loader2 className="w-3 h-3 relative z-10 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3 relative z-10" />
                  )}
                  <span className="relative z-10">
                    {isDigesting ? 'Retrying...' : 'Retry'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {getStatusIcon()}
                <span className="text-xs text-white/60 whitespace-nowrap">{getStatusText()}</span>
              </div>
            )}
          </div>
        </div>

        <div ref={dropdownRef} className="opacity-0 group-hover:opacity-100 transition-opacity ml-3 flex-shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDropdown(!showDropdown)
            }}
            className="p-1.5 hover:bg-white/10 rounded cursor-pointer"
          >
            <MoreVertical className="w-4 h-4 text-white/60" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-white/20 rounded-lg shadow-xl py-1 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(false)
                  setShowDeleteConfirm(true)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {processingStatus === 'PROCESSING' && (
        <div className="mt-2 ml-13">
          <div className="w-64 bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, percentageCompletion || 0))}%` }}
            />
          </div>
        </div>
      )}

      </div>
    </>
  )
}