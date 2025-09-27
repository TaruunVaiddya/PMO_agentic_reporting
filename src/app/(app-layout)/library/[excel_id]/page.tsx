"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileSpreadsheet, Search, Grid, List, X } from 'lucide-react'

// Components
import { TableCard, ExtractedTable } from '@/components/library/excel-details/table-card'
import { TableListItem } from '@/components/library/excel-details/table-list-item'
import { TablePreviewModal } from '@/components/library/excel-details/table-preview-modal'

// Utils and data
import {
  formatFileSize,
  formatRelativeTime,
  generateAllTables,
  filterTables,
  getUniqueSheetNames
} from '@/lib/excel-utils'
import {
  getMockDocument,
  getMockProcessedTables,
  getMockCurrentlyProcessingTable
} from '@/lib/mock-data'

export default function ExcelDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTable, setSelectedTable] = useState<ExtractedTable | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [filterSheet, setFilterSheet] = useState<string>('all')

  // Mock data - replace with actual API calls
  const document = getMockDocument(params.excel_id as string)
  const processedTables = getMockProcessedTables()
  const currentlyProcessingTable = getMockCurrentlyProcessingTable()

  // Generate all tables including queue placeholders
  const allTables = generateAllTables(processedTables, currentlyProcessingTable, document)

  // Get unique sheet names for filtering
  const sheetNames = getUniqueSheetNames(processedTables)

  // Filter tables based on search and sheet filter
  const filteredTables = filterTables(allTables, searchQuery, filterSheet)

  const handleTablePreview = (table: ExtractedTable) => {
    setSelectedTable(table)
    setShowPreview(true)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    setSelectedTable(null)
  }

  return (
    <>
      <TablePreviewModal
        table={selectedTable}
        isOpen={showPreview}
        onClose={handleClosePreview}
      />

      <div className="w-full max-h-[97vh]">
        <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
          {/* Single Row Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/library')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-t from-green-600/20 to-green-500/30 border border-green-500/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-400" />
                </div>

                <div>
                  <h1 className="text-lg font-semibold text-white/90">{document.document_name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/60">{formatFileSize(document.document_size)}</span>
                    <span className="text-xs text-white/40">•</span>
                    <span className="text-xs text-white/60">{formatRelativeTime(document.upload_date)}</span>
                    <span className="text-xs text-white/40">•</span>
                    <span className="text-xs text-white/60">{document.extracted_tables}/{document.estimated_tables} tables</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-10 pr-4 py-2 rounded-lg bg-black/10 border border-white/10 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={filterSheet}
                onChange={(e) => setFilterSheet(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-lg text-sm bg-black/10 text-white/80 border border-white/10 focus:outline-none focus:border-white/20 appearance-none cursor-pointer w-32"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff60' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 8px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px'
                }}
                title={filterSheet === 'all' ? 'All Sheets' : filterSheet}
              >
                <option value="all" className="bg-black text-white" title="All Sheets">All Sheets</option>
                {sheetNames.map(sheet => (
                  <option
                    key={sheet}
                    value={sheet}
                    className="bg-black text-white truncate"
                    title={sheet}
                  >
                    {sheet.length > 15 ? `${sheet.substring(0, 15)}...` : sheet}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tables Grid/List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white/60 mb-2">No tables found</h3>
                <p className="text-sm text-white/40">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredTables.map((table, index) => (
                  <TableCard
                    key={table.table_id}
                    table={table}
                    index={index}
                    extractedCount={document.extracted_tables}
                    onPreview={handleTablePreview}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 pb-6">
                {filteredTables.map((table, index) => (
                  <TableListItem
                    key={table.table_id}
                    table={table}
                    index={index}
                    extractedCount={document.extracted_tables}
                    onPreview={handleTablePreview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}