import { Table, X, Copy, Download, Loader2 } from 'lucide-react'
import { ExtractedTable } from './table-card'

interface TablePreviewModalProps {
  table: ExtractedTable | null
  isOpen: boolean
  onClose: () => void
}

export function TablePreviewModal({ table, isOpen, onClose }: TablePreviewModalProps) {
  if (!table || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-black/95 backdrop-blur-md border border-white/15 rounded-xl overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-white/60" />
            <div>
              <h3 className="text-lg font-semibold text-white">{table.table_name}</h3>
              <p className="text-sm text-white/60">
                {table.sheet_name} • {table.row_count} rows × {table.column_count} columns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-4 overflow-auto custom-scrollbar">
          {table.data_preview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {table.data_preview[0].map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-2 text-left text-sm font-semibold text-white/90 bg-white/5 border border-white/10 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.data_preview.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-white/5">
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-4 py-2 text-sm text-white/70 border border-white/10 whitespace-nowrap"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white/40 animate-spin mb-3" />
              <p className="text-white/60">Table data is being extracted...</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
              {table.extraction_confidence}% Confidence
            </span>
            {table.has_headers && (
              <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                Headers Detected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors border border-white/10 cursor-pointer">
              <Copy className="w-4 h-4" />
              Copy Data
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors border border-blue-500/30 cursor-pointer">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}