import { FileText, FileSpreadsheet, MoreVertical, Clock, CheckCircle, AlertCircle, Loader2, AlertTriangle, BarChart3, PieChart, TrendingUp, Database, Brain, FileBarChart, Activity, Target, Zap, Sparkles, RotateCcw } from 'lucide-react'
import { formatRelativeTime } from '@/lib/date-utils'
import { useRouter } from 'next/navigation'

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
  onClick
}: DocumentListItemProps) {
  const router = useRouter()

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
      router.push(`/library/${documentId}`)
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleItemClick}
      className="group p-3 bg-card hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer">
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
                <button className="relative flex items-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-300 text-xs font-medium text-white/80 hover:text-blue-400 cursor-pointer border border-white/10 hover:border-white/20 overflow-hidden">
                  <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.12) 50%, rgba(29,78,216,0) 100%)"
                    }}
                  />
                  <Sparkles className="w-3 h-3 relative z-10" />
                  <span className="relative z-10">Digest</span>
                </button>
              </div>
            ) : processingStatus === 'FAILED' ? (
              <div className="relative group">
                <button className="relative flex items-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-300 text-xs font-medium text-white/80 hover:text-red-400 cursor-pointer border border-white/10 hover:border-white/20 overflow-hidden">
                  <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(220,38,38,0.12) 50%, rgba(185,28,28,0) 100%)"
                    }}
                  />
                  <RotateCcw className="w-3 h-3 relative z-10" />
                  <span className="relative z-10">Retry</span>
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

        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded ml-3 flex-shrink-0 cursor-pointer">
          <MoreVertical className="w-4 h-4 text-white/60" />
        </button>
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
  )
}