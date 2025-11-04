import { ExtractedTable } from '@/components/library/excel-details/table-card'

export interface ExcelDocument {
  document_id: string
  document_name: string
  document_type: string
  processing_status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  percentage_completion: number
  document_size: number
  upload_date: string
  sheet_count: number
  estimated_tables: number
  extracted_tables: number
  currently_processing: number
  failed_tables: number
  user_suggestion?: string | null
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function generateQueuePlaceholders(startId: number, count: number): ExtractedTable[] {
  return Array.from({ length: count }, (_, index) => ({
    table_id: `${startId + index}`,
    table_name: `Table ${startId + index}`,
    sheet_name: 'Unknown',
    row_count: 0,
    column_count: 0,
    extraction_confidence: 0,
    has_headers: false,
    extraction_status: 'PENDING' as const,
    data_preview: []
  }))
}

export function generateAllTables(
  processedTables: ExtractedTable[],
  currentlyProcessingTable: ExtractedTable,
  document: ExcelDocument
): ExtractedTable[] {
  const remainingTables = Math.max(
    0,
    document.estimated_tables - document.extracted_tables - document.currently_processing - document.failed_tables
  )
  const queuePlaceholders = generateQueuePlaceholders(8, remainingTables)

  return [
    ...processedTables,
    currentlyProcessingTable,
    ...queuePlaceholders
  ]
}

export function filterTables(
  tables: ExtractedTable[],
  searchQuery: string,
  filterSheet: string
): ExtractedTable[] {
  return tables.filter(table => {
    const matchesSearch = searchQuery === '' ||
      table.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.sheet_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSheet = filterSheet === 'all' || table.sheet_name === filterSheet

    return matchesSearch && matchesSheet
  })
}

export function getUniqueSheetNames(tables: ExtractedTable[]): string[] {
  return Array.from(new Set(tables.map(t => t.sheet_name).filter(name => name !== 'Unknown')))
}