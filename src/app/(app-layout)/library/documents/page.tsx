"use client"

import { useState, Suspense } from 'react'
import { Upload, Search, Grid, List, Filter, X, ChevronDown, Network, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DocumentCard } from '@/components/library/document-card'
import { DocumentListItem } from '@/components/library/document-list-item'
import { UploadModal } from '@/components/library/upload-modal'
import { PdfPreviewDrawer } from '@/components/library/pdf-preview-drawer'
import { MetallicButton } from '@/components/ui/metallic-button'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR from 'swr'
import { fetcher } from '@/lib/get-fetcher'

function LibraryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const collectionId = searchParams.get('collection')

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'PDF' | 'Excel'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'NOT_STARTED' | 'IN_QUEUE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<any>(null)
  const [showPdfPreview, setShowPdfPreview] = useState(false)

  // Use SWR for better data fetching and caching
  // Include collection_id in the API path if it exists
  const apiPath = collectionId ? `/documents/${collectionId}` : '/documents'
  const { data, error: swrError, isLoading, mutate } = useSWR(apiPath, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const documents = Array.isArray(data) ? data : (data?.documents ?? [])

  // Handle various error formats
  let error: string | null = null
  if (swrError) {
    if (swrError?.message) {
      error = typeof swrError.message === 'string' ? swrError.message : 'Failed to load documents'
    } else if (swrError?.detail) {
      if (typeof swrError.detail === 'string') {
        error = swrError.detail
      } else if (typeof swrError.detail === 'object' && swrError.detail.error) {
        error = swrError.detail.error
      }
    } else {
      error = 'Failed to load documents'
    }
  }

  // Filter documents based on search and filters (normalize on the fly)
  const filteredDocuments = documents.filter((doc: any) => {
    const name = (doc.document_name ?? doc.name ?? '') as string
    const type = (doc.document_type ?? 'OTHER') as string
    const status = (doc.processing_status ?? 'NOT_STARTED') as string

    const matchesSearch = searchQuery === '' || name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || type === filterType
    const matchesStatus = filterStatus === 'all' || status === filterStatus

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

  const handleDigest = (documentId: string) => {
    // Optimistically update the document status to IN_QUEUE
    mutate((currentData: any) => {
      const currentDocs = Array.isArray(currentData) ? currentData : (currentData?.documents ?? [])
      const updatedDocs = currentDocs.map((doc: any) =>
        (doc.document_id ?? doc.id) === documentId
          ? { ...doc, processing_status: 'IN_QUEUE', percentage_completion: 0 }
          : doc
      )
      return Array.isArray(currentData)
        ? updatedDocs
        : { ...currentData, documents: updatedDocs }
    }, false) // false = don't revalidate immediately

    // Revalidate in the background to get server state
    setTimeout(() => mutate(), 1000)
  }

  const handleDelete = (documentId: string) => {
    // Optimistically remove the document from the list
    mutate((currentData: any) => {
      const currentDocs = Array.isArray(currentData) ? currentData : (currentData?.documents ?? [])
      const updatedDocs = currentDocs.filter((doc: any) => (doc.document_id ?? doc.id) !== documentId)
      return Array.isArray(currentData)
        ? updatedDocs
        : { ...currentData, documents: updatedDocs }
    }, false) // false = don't revalidate immediately

    // Revalidate in the background to sync with server
    setTimeout(() => mutate(), 1000)
  }

  return (
    <>
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        collectionId={collectionId}
        onOptimisticUpdate={(newDocuments) => {
          // Optimistically update the cache with new documents
          mutate((currentData: any) => {
            const currentDocs = Array.isArray(currentData) ? currentData : (currentData?.documents ?? [])
            return Array.isArray(currentData)
              ? [...newDocuments, ...currentDocs]
              : { ...currentData, documents: [...newDocuments, ...currentDocs] }
          }, false) // false = don't revalidate immediately, show optimistic data first

          // Revalidate in the background to get the server state
          setTimeout(() => mutate(), 500)
        }}
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
              {/* Back Button */}
              <button
                onClick={() => router.replace('/library')}
                className="px-3 py-2.5 rounded-lg bg-black/10 hover:bg-black/20 border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-2 cursor-pointer text-white/80 hover:text-white/90"
                title="Back to Collections"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

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

              <MetallicButton
                type="button"
                onClick={() => router.push('/library/knowledge')}
              >
                <Network className="w-4 h-4" />
                <span>Knowledge Graph</span>
              </MetallicButton>

              <MetallicButton type="button" onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </MetallicButton>
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
{isLoading ? (
            <div className="pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/10 bg-black/10">
                    <Skeleton className="h-40 w-full mb-4 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-t from-red-500/10 to-red-500/20 border border-red-500/30 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">Failed to load documents</h3>
              <p className="text-sm text-white/50 mb-4">{error}</p>
            </div>
          ) : documents.length === 0 ? (
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
              <MetallicButton type="button" onClick={() => setShowUploadModal(true)} className="px-6 py-3 gap-3">
                <Upload className="w-4 h-4" />
                <span>Upload Your First Document</span>
              </MetallicButton>
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
              {filteredDocuments.map((doc: any) => {
                const normalized = {
                  document_id: doc.document_id ?? doc.id ?? '',
                  document_name: doc.document_name ?? doc.name ?? 'Untitled',
                  document_type: doc.document_type ?? 'OTHER',
                  processing_status: doc.processing_status ?? 'NOT_STARTED',
                  percentage_completion: doc.percentage_completion ?? 0,
                  document_size: doc.document_size ?? doc.size ?? 0,
                  upload_date: (doc.upload_date ?? doc.created_at ?? new Date().toISOString()),
                  user_suggestion: doc.user_suggestion ?? null,
                }
                return (
                  <DocumentCard
                    key={normalized.document_id}
                    documentId={normalized.document_id}
                    documentName={normalized.document_name}
                    documentType={normalized.document_type}
                    processingStatus={normalized.processing_status}
                    percentageCompletion={normalized.percentage_completion}
                    documentSize={normalized.document_size}
                    uploadDate={normalized.upload_date}
                    userSuggestion={normalized.user_suggestion}
                    onClick={() => handleDocumentClick(normalized)}
                    onDigest={handleDigest}
                    onDelete={handleDelete}
                  />
                )
              })}
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {filteredDocuments.map((doc: any) => {
                const normalized = {
                  document_id: doc.document_id ?? doc.id ?? '',
                  document_name: doc.document_name ?? doc.name ?? 'Untitled',
                  document_type: doc.document_type ?? 'OTHER',
                  processing_status: doc.processing_status ?? 'NOT_STARTED',
                  percentage_completion: doc.percentage_completion ?? 0,
                  document_size: doc.document_size ?? doc.size ?? 0,
                  upload_date: (doc.upload_date ?? doc.created_at ?? new Date().toISOString()),
                  user_suggestion: doc.user_suggestion ?? null,
                }
                return (
                  <DocumentListItem
                    key={normalized.document_id}
                    documentId={normalized.document_id}
                    documentName={normalized.document_name}
                    documentType={normalized.document_type}
                    processingStatus={normalized.processing_status}
                    percentageCompletion={normalized.percentage_completion}
                    documentSize={normalized.document_size}
                    uploadDate={normalized.upload_date}
                    userSuggestion={normalized.user_suggestion}
                    onClick={() => handleDocumentClick(normalized)}
                    onDigest={handleDigest}
                    onDelete={handleDelete}
                  />
                )
              })}
            </div>
          )}
          </div>
      </div>
      </div>
    </>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-h-[97vh]">
        <div className='bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10'>
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  )
}
