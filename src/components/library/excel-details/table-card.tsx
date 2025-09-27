import { Table, Loader2, CheckCircle, Clock, Eye, Download } from 'lucide-react'

export interface ExtractedTable {
  table_id: string
  table_name: string
  sheet_name: string
  row_count: number
  column_count: number
  extraction_confidence: number
  has_headers: boolean
  data_preview: any[][]
  extraction_status: 'pending' | 'extracted' | 'failed'
}

interface TableCardProps {
  table: ExtractedTable
  index: number
  extractedCount: number
  onPreview: (table: ExtractedTable) => void
}

export function TableCard({ table, index, extractedCount, onPreview }: TableCardProps) {
  const isExtracted = table.extraction_status === 'extracted'
  const isProcessing = table.extraction_status === 'pending' && index === extractedCount
  const isInQueue = table.extraction_status === 'pending' && index > extractedCount

  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    if (isExtracted) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-white/30" />
  }

  const getCardStyles = () => {
    if (isExtracted) return 'bg-card hover:bg-white/5 border border-white/15 hover:border-white/20 cursor-pointer'
    if (isProcessing) return 'bg-blue-500/5 border border-blue-500/20'
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
      className={`group relative rounded-lg p-4 transition-all duration-200 ${getCardStyles()}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Table className={`w-5 h-5 ${isInQueue ? 'text-white/20' : 'text-white/60'}`} />
          {getStatusIcon()}
        </div>
        <span className={`px-2 py-1 text-xs rounded border ${getSheetBadgeStyles()}`}>
          {isInQueue ? 'Unknown' : table.sheet_name}
        </span>
      </div>

      <h3 className={`text-sm font-medium mb-2 ${isInQueue ? 'text-white/40' : 'text-white/90'}`}>
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <span>{table.table_name}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
              Processing...
            </span>
          </div>
        ) : (
          table.table_name
        )}
      </h3>

      <div className="space-y-2 text-xs text-white/60">
        {isExtracted ? (
          <>
            <div className="flex items-center justify-between">
              <span>Size</span>
              <span className="text-white/80">{table.row_count} × {table.column_count}</span>
            </div>
            {table.extraction_confidence > 0 && (
              <div className="flex items-center justify-between">
                <span>Confidence</span>
                <span className={getConfidenceColor(table.extraction_confidence)}>
                  {table.extraction_confidence}%
                </span>
              </div>
            )}
          </>
        ) : isProcessing ? (
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="text-blue-400">Analyzing structure...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="text-white/30">In queue</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        {isExtracted ? (
          <>
            <button className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/80 transition-colors cursor-pointer">
              <Eye className="w-3 h-3" />
              Preview
            </button>
            <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
              <Download className="w-3 h-3" />
              Export
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <span className="text-xs text-white/40">
              {isProcessing ? 'Processing...' : 'Waiting in queue'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}