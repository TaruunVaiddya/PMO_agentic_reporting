import { Table, Loader2, CheckCircle, Clock, Eye, Download, ChevronRight, AlertCircle } from 'lucide-react'
import { ExtractedTable } from './table-card'

interface TableListItemProps {
  table: ExtractedTable
  index: number
  extractedCount: number
  onPreview: (table: ExtractedTable) => void
}

export function TableListItem({ table, index, extractedCount, onPreview }: TableListItemProps) {
  const isExtracted = table.extraction_status === 'COMPLETED'
  const isProcessing = table.extraction_status === 'PROCESSING'
  const isFailed = table.extraction_status === 'FAILED'
  const isInQueue = table.extraction_status === 'IN_QUEUE' || table.extraction_status === 'PENDING' || table.extraction_status === 'NOT_STARTED'

  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    if (isExtracted) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (isFailed) return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-white/30" />
  }

  const getItemStyles = () => {
    if (isExtracted) return 'bg-card hover:bg-white/5 border border-white/15 hover:border-white/20 cursor-pointer'
    if (isProcessing) return 'bg-blue-500/5 border border-blue-500/20'
    if (isFailed) return 'bg-red-500/5 border border-red-500/20'
    return 'bg-white/[0.02] border border-white/5'
  }

  const getSheetBadgeStyles = () => {
    if (isInQueue) return 'bg-white/[0.02] text-white/30 border-white/5'
    return 'bg-white/10 text-white/60 border-white/10'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 95) return 'text-green-400'
    if (confidence > 90) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <div
      onClick={() => isExtracted && onPreview(table)}
      className={`group flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${getItemStyles()}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Table className={`w-5 h-5 ${isInQueue ? 'text-white/20' : 'text-white/60'}`} />
          {getStatusIcon()}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-medium ${isInQueue ? 'text-white/40' : 'text-white/90'}`}>
              {table.table_name}
            </h3>
            <span className={`px-2 py-0.5 text-xs rounded border ${getSheetBadgeStyles()}`}>
              {isInQueue ? 'Unknown' : table.sheet_name}
            </span>
            {isProcessing && (
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                Processing...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-white/60">
            {isExtracted ? (
              <>
                <span>{table.row_count} rows × {table.column_count} columns</span>
                {table.extraction_confidence > 0 && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className={getConfidenceColor(table.extraction_confidence)}>
                      {table.extraction_confidence}% confidence
                    </span>
                  </>
                )}
              </>
            ) : isProcessing ? (
              <span className="text-blue-400">Analyzing structure...</span>
            ) : isFailed ? (
              <span className="text-red-400">Extraction failed</span>
            ) : (
              <span className="text-white/30">Waiting in queue</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isExtracted ? (
          <>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
              <Eye className="w-4 h-4 text-white/60" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
              <Download className="w-4 h-4 text-white/60" />
            </button>
            <ChevronRight className="w-5 h-5 text-white/40 ml-2" />
          </>
        ) : (
          <span className="text-xs text-white/40 mr-4">
            {isProcessing ? 'Processing...' : isFailed ? 'Failed' : 'In queue'}
          </span>
        )}
      </div>
    </div>
  )
}