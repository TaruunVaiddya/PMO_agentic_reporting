"use client"

import { useState } from 'react'
import { Upload, Search, Grid, List, Filter, X, ChevronDown } from 'lucide-react'
import { DocumentCard } from '@/components/library/document-card'
import { DocumentListItem } from '@/components/library/document-list-item'
import { UploadModal } from '@/components/library/upload-modal'
import { PdfPreviewDrawer } from '@/components/library/pdf-preview-drawer'

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'PDF' | 'Excel'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'NOT_STARTED' | 'IN_QUEUE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<any>(null)
  const [showPdfPreview, setShowPdfPreview] = useState(false)

  // Sample data - replace with actual API data
  const documents = [
    {
      document_id: '1',
      document_name: 'Q3 Financial Report.pdf',
      document_type: 'PDF',
      processing_status: 'COMPLETED' as const,
      percentage_completion: 100,
      document_size: 2516582,
      upload_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user_suggestion: null
    },
    {
      document_id: '2',
      document_name: 'Sales Data August 2024.xlsx',
      document_type: 'Excel',
      processing_status: 'PROCESSING' as const,
      percentage_completion: 65,
      document_size: 1887436,
      upload_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      user_suggestion: null
    },
    {
      document_id: '3',
      document_name: 'Product Inventory.xlsx',
      document_type: 'Excel',
      processing_status: 'COMPLETED' as const,
      percentage_completion: 100,
      document_size: 3355443,
      upload_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user_suggestion: null
    },
    {
      document_id: '4',
      document_name: 'Annual Report 2023.pdf',
      document_type: 'PDF',
      processing_status: 'FAILED' as const,
      percentage_completion: 0,
      document_size: 5872025,
      upload_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user_suggestion: 'Document appears to be corrupted. Please try uploading again.'
    },
    {
      document_id: '5',
      document_name: 'Customer Feedback Analysis.xlsx',
      document_type: 'Excel',
      processing_status: 'COMPLETED' as const,
      percentage_completion: 100,
      document_size: 911360,
      upload_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user_suggestion: null
    },
    {
      document_id: '6',
      document_name: 'Marketing Campaign Results.pdf',
      document_type: 'PDF',
      processing_status: 'IN_QUEUE' as const,
      percentage_completion: 0,
      document_size: 1258291,
      upload_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      user_suggestion: null
    },
    // {
    //   document_id: '7',
    //   document_name: 'Budget Analysis 2024.xlsx',
    //   document_type: 'Excel',
    //   processing_status: 'NOT_STARTED' as const,
    //   percentage_completion: 0,
    //   document_size: 2145728,
    //   upload_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '8',
    //   document_name: 'Very Long Document Name That Should Test The Two Line Truncation Feature In Our Card View Component.pdf',
    //   document_type: 'PDF',
    //   processing_status: 'COMPLETED' as const,
    //   percentage_completion: 100,
    //   document_size: 0, // Test zero file size
    //   upload_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '5',
    //   document_name: 'Customer Feedback Analysis.xlsx',
    //   document_type: 'Excel',
    //   processing_status: 'COMPLETED' as const,
    //   percentage_completion: 100,
    //   document_size: 911360,
    //   upload_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '6',
    //   document_name: 'Marketing Campaign Results.pdf',
    //   document_type: 'PDF',
    //   processing_status: 'IN_QUEUE' as const,
    //   percentage_completion: 0,
    //   document_size: 1258291,
    //   upload_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '7',
    //   document_name: 'Budget Analysis 2024.xlsx',
    //   document_type: 'Excel',
    //   processing_status: 'NOT_STARTED' as const,
    //   percentage_completion: 0,
    //   document_size: 2145728,
    //   upload_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '8',
    //   document_name: 'Very Long Document Name That Should Test The Two Line Truncation Feature In Our Card View Component.pdf',
    //   document_type: 'PDF',
    //   processing_status: 'COMPLETED' as const,
    //   percentage_completion: 100,
    //   document_size: 0, // Test zero file size
    //   upload_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '5',
    //   document_name: 'Customer Feedback Analysis.xlsx',
    //   document_type: 'Excel',
    //   processing_status: 'COMPLETED' as const,
    //   percentage_completion: 100,
    //   document_size: 911360,
    //   upload_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '6',
    //   document_name: 'Marketing Campaign Results.pdf',
    //   document_type: 'PDF',
    //   processing_status: 'IN_QUEUE' as const,
    //   percentage_completion: 0,
    //   document_size: 1258291,
    //   upload_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '7',
    //   document_name: 'Budget Analysis 2024.xlsx',
    //   document_type: 'Excel',
    //   processing_status: 'NOT_STARTED' as const,
    //   percentage_completion: 0,
    //   document_size: 2145728,
    //   upload_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // },
    // {
    //   document_id: '8',
    //   document_name: 'Very Long Document Name That Should Test The Two Line Truncation Feature In Our Card View Component.pdf',
    //   document_type: 'PDF',
    //   processing_status: 'COMPLETED' as const,
    //   percentage_completion: 100,
    //   document_size: 0, // Test zero file size
    //   upload_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    //   user_suggestion: null
    // }
  ]

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filter
    const matchesType = filterType === 'all' || doc.document_type === filterType

    // Status filter
    const matchesStatus = filterStatus === 'all' || doc.processing_status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Get unique statuses for filter dropdown
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_QUEUE', label: 'In Queue' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' }
  ]

  const handleDocumentClick = (doc: any) => {
    if (doc.document_type === 'PDF') {
      setSelectedPdf(doc)
      setShowPdfPreview(true)
    }
  }

  const handleClosePdfPreview = () => {
    setShowPdfPreview(false)
    setSelectedPdf(null)
  }

  return (
    <>
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />

      <PdfPreviewDrawer
        isOpen={showPdfPreview}
        onClose={handleClosePdfPreview}
        document={selectedPdf}
      />

      <div className="w-full max-h-[97vh]  ">
        <div className='bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10'>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-black/10 border border-white/10 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    showFilters || filterType !== 'all' || filterStatus !== 'all'
                      ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                      : 'bg-black/10 hover:bg-black/20 border-white/10 text-white/80'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                  {(filterType !== 'all' || filterStatus !== 'all') && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500/30 rounded-full">
                      {[filterType !== 'all' && 1, filterStatus !== 'all' && 1].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

              <div className="relative group">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-lg transition-all duration-300 text-sm font-medium text-white/80 hover:text-white cursor-pointer border border-white/10 hover:border-white/20 overflow-hidden"
                >
                  <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle, rgba(148,163,184,0.25) 0%, rgba(100,116,139,0.12) 50%, rgba(71,85,105,0) 100%)]"
                    style={{
                      background: "radial-gradient(circle, rgba(148,163,184,0.25) 0%, rgba(100,116,139,0.12) 20%, rgba(71,85,105,0) 70%)"
                    }}
                  />
                  <Upload className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-card rounded-lg border border-white/10 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Type:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                        filterType === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-black/10 text-white/60 hover:bg-black/20'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterType('PDF')}
                      className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                        filterType === 'PDF'
                          ? 'bg-blue-600 text-white'
                          : 'bg-black/10 text-white/60 hover:bg-black/20'
                      }`}
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => setFilterType('Excel')}
                      className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                        filterType === 'Excel'
                          ? 'bg-blue-600 text-white'
                          : 'bg-black/10 text-white/60 hover:bg-black/20'
                      }`}
                    >
                      Excel
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-1 rounded text-xs bg-black/10 text-white/80 border border-white/10 focus:outline-none focus:border-white/20"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(filterType !== 'all' || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setFilterType('all')
                      setFilterStatus('all')
                    }}
                    className="ml-auto px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results count */}
          {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
            <div className="mb-4 text-sm text-white/60 flex-shrink-0">
              Found {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
{documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-white/60" />
              </div>
              <h3 className="text-xl font-semibold text-white/90 mb-3">
                Welcome to your document library
              </h3>
              <p className="text-sm text-white/60 mb-8 max-w-md">
                Start by uploading your first document. We support PDF and Excel files for AI-powered analysis and insights.
              </p>
              <div className="relative group">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="relative flex items-center gap-3 px-6 py-3 bg-black/10 hover:bg-black/20 backdrop-blur-sm rounded-lg transition-all duration-300 text-sm font-medium text-white/80 hover:text-blue-400 cursor-pointer border border-white/10 hover:border-white/20 overflow-hidden"
                >
                  <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.12) 50%, rgba(29,78,216,0) 100%)"
                    }}
                  />
                  <Upload className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Upload Your First Document</span>
                </button>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">
                No documents found
              </h3>
              <p className="text-sm text-white/50 mb-4">
                {searchQuery
                  ? `No documents match "${searchQuery}"`
                  : 'Try adjusting your filters'}
              </p>
              {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterType('all')
                    setFilterStatus('all')
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.document_id}
                  documentId={doc.document_id}
                  documentName={doc.document_name}
                  documentType={doc.document_type}
                  processingStatus={doc.processing_status}
                  percentageCompletion={doc.percentage_completion}
                  documentSize={doc.document_size}
                  uploadDate={doc.upload_date}
                  userSuggestion={doc.user_suggestion}
                  onClick={() => handleDocumentClick(doc)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {filteredDocuments.map((doc) => (
                <DocumentListItem
                  key={doc.document_id}
                  documentId={doc.document_id}
                  documentName={doc.document_name}
                  documentType={doc.document_type}
                  processingStatus={doc.processing_status}
                  percentageCompletion={doc.percentage_completion}
                  documentSize={doc.document_size}
                  uploadDate={doc.upload_date}
                  userSuggestion={doc.user_suggestion}
                  onClick={() => handleDocumentClick(doc)}
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


