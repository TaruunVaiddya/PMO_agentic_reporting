"use client"

import { useState, useEffect } from 'react'
import { X, Download, FileText, Calendar, HardDrive, Maximize2, RotateCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertCircle, Edit2, Save, XCircle } from 'lucide-react'
import { formatFileSize, formatRelativeTime } from '@/lib/excel-utils'
import { motion, AnimatePresence } from 'motion/react'
import { fetcher } from '@/lib/get-fetcher'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PdfPreviewDrawerProps {
  isOpen: boolean
  onClose: () => void
  document: {
    document_id: string
    document_name: string
    document_type: string
    processing_status: 'NOT_STARTED' | 'IN_QUEUE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    percentage_completion: number
    document_size: number
    upload_date: string
    user_suggestion?: string | null
  } | null
}

interface PdfDetails {
  id: string
  document_id: string
  document_url: string
  extracted_text: any | null
  pages_processed: number
  ai_summary: Array<{ header: string; summary: string }> | null
  created_at: string
}

export function PdfPreviewDrawer({ isOpen, onClose, document }: PdfPreviewDrawerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'summary'>('preview')

  // API data state
  const [pdfDetails, setPdfDetails] = useState<PdfDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // PDF loading state
  const [isPdfLoading, setIsPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)

  // Edit states for summary sections
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({})
  const [editedSummaries, setEditedSummaries] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && document) {
      setCurrentPage(1)
      setZoomLevel(100)
      setActiveTab('preview')
      setPdfDetails(null)
      setDetailsError(null)
      setEditingSections({})
      setEditedSummaries({})
      setIsPdfLoading(true)
      setPdfError(false)

      // Fetch PDF details from API
      fetchPdfDetails()
    }
  }, [isOpen, document])

  const fetchPdfDetails = async () => {
    if (!document) return

    setIsLoadingDetails(true)
    setDetailsError(null)
    setIsPdfLoading(true)
    setPdfError(false)

    try {
      const response = await fetcher(`/documents/${document.document_id}/pdf-details`)
      // pdf_details is an array, get the first element
      const pdfDetailsData = Array.isArray(response.pdf_details)
        ? response.pdf_details[0]
        : response.pdf_details
      setPdfDetails(pdfDetailsData)

      // Initialize edited summaries with API data
      if (pdfDetailsData.ai_summary) {
        const initialSummaries: Record<string, string> = {}
        pdfDetailsData.ai_summary.forEach((item: { header: string; summary: string }) => {
          initialSummaries[item.header] = item.summary
        })
        setEditedSummaries(initialSummaries)
      }

      // For PDFs, iframe onLoad is unreliable, so we hide loading after a short delay
      // once we have the URL
      if (pdfDetailsData.document_url) {
        setTimeout(() => {
          setIsPdfLoading(false)
        }, 1000)
      } else {
        setIsPdfLoading(false)
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load PDF details'
      setDetailsError(errorMessage)
      setPdfError(true)
      setIsPdfLoading(false)
      toast.error(errorMessage)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  if (!document || !isOpen) return null

  const totalPages = pdfDetails?.pages_processed || 1

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50))
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handleDownload = () => {
    if (pdfDetails?.document_url) {
      window.open(pdfDetails.document_url, '_blank')
    } else {
      toast.error('PDF URL not available')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-black/95 backdrop-blur-xl border-l border-white/20 shadow-2xl z-50"
          >
            <div className="h-full flex flex-col relative">
              {/* Subtle shine effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/3 to-transparent" />
              </div>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-t from-white/5 to-white/10 border border-white/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white/90">{document.document_name}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-white/60">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(document.document_size)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/60">
                    <Calendar className="w-3 h-3" />
                    {formatRelativeTime(document.upload_date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30"
                title="Download PDF"
              >
                <Download className="w-5 h-5 text-white/60 hover:text-white/80" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30"
              >
                <X className="w-5 h-5 text-white/60 hover:text-white/80" />
              </button>
            </div>
          </div>

          {/* Tabs and Controls */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'bg-black/30 text-white border border-white/20'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === 'text'
                    ? 'bg-black/30 text-white border border-white/20'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }`}
              >
                Extracted Text
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === 'summary'
                    ? 'bg-black/30 text-white border border-white/20'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }`}
              >
                AI Summary
              </button>
            </div>

            {/* PDF Controls - Only show when in preview tab and PDF is loaded */}
            {activeTab === 'preview' && pdfDetails && (
              <div className="flex items-center gap-3">
                {pdfDetails.pages_processed > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/80 font-medium">
                      {pdfDetails.pages_processed} {pdfDetails.pages_processed === 1 ? 'page' : 'pages'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 50}
                    className="p-1 hover:bg-white/10 rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-white/60" />
                  </button>
                  <span className="text-xs text-white/80 font-medium w-10 text-center">{zoomLevel}%</span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 200}
                    className="p-1 hover:bg-white/10 rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-white/60" />
                  </button>
                  <div className="w-px h-3 bg-white/20 mx-1" />
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="p-1 hover:bg-white/10 rounded transition-all duration-200 border border-white/10 hover:border-white/20"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'preview' && (
              <div className="h-full overflow-auto bg-black/10 relative z-10">
                {isLoadingDetails || isPdfLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                      <p className="text-sm text-white/60">
                        {isLoadingDetails ? 'Loading PDF details...' : 'Loading PDF preview...'}
                      </p>
                    </div>
                  </div>
                ) : pdfError || detailsError ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <p className="text-sm text-white/60">{detailsError || 'Failed to load PDF'}</p>
                      <button
                        onClick={fetchPdfDetails}
                        className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/30 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 text-white/80"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span className="text-sm">Retry</span>
                      </button>
                    </div>
                  </div>
                ) : !pdfDetails?.document_url ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-yellow-400" />
                      <p className="text-sm text-white/60">PDF URL not available</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full relative">
                    {isPdfLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                          <p className="text-sm text-white/60">Loading PDF preview...</p>
                        </div>
                      </div>
                    )}
                    <iframe
                      src={`${pdfDetails.document_url}#navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title={document.document_name}
                      style={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center',
                        height: `${(100 / zoomLevel) * 100}%`
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'text' && (
              <div className="h-full overflow-auto p-6 relative z-10">
                <div className="max-w-none">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Extracted Text</h3>
                  {isLoadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-3" />
                      <p className="text-sm text-white/60">Loading extracted text...</p>
                    </div>
                  ) : detailsError ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                      <p className="text-sm text-white/60 mb-4">{detailsError}</p>
                      <button
                        onClick={fetchPdfDetails}
                        className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/30 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 text-white/80"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span className="text-sm">Retry</span>
                      </button>
                    </div>
                  ) : !pdfDetails?.extracted_text ? (
                    <div className="bg-black/30 rounded-lg p-8 border border-white/20 text-center">
                      <p className="text-sm text-white/60">No extracted text available for this document.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Check if extracted_text is an array of pages */}
                      {Array.isArray(pdfDetails.extracted_text) ? (
                        pdfDetails.extracted_text.map((page: any, index: number) => (
                          <div key={index} className="bg-black/30 rounded-lg border border-white/20 overflow-hidden">
                            {/* Page Number Badge */}
                            <div className="bg-black/40 px-4 py-2 border-b border-white/10">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                  <FileText className="w-3.5 h-3.5 text-white/60" />
                                </div>
                                <span className="text-xs font-medium text-white/70">
                                  Page {page.page_number || index + 1}
                                </span>
                              </div>
                            </div>

                            {/* Markdown Content */}
                            <div className="p-5">
                              <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    // Headings
                                    h1: ({ node, ...props }) => (
                                      <h1 className="text-xl font-bold text-white/90 mb-3 mt-4 first:mt-0" {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                      <h2 className="text-lg font-bold text-white/85 mb-2.5 mt-3.5 first:mt-0" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                      <h3 className="text-base font-semibold text-white/80 mb-2 mt-3 first:mt-0" {...props} />
                                    ),
                                    h4: ({ node, ...props }) => (
                                      <h4 className="text-sm font-semibold text-white/75 mb-1.5 mt-2.5 first:mt-0" {...props} />
                                    ),
                                    // Paragraphs
                                    p: ({ node, ...props }) => (
                                      <p className="text-sm text-white/70 leading-relaxed mb-3" {...props} />
                                    ),
                                    // Lists
                                    ul: ({ node, ...props }) => (
                                      <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-white/70" {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-white/70" {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li className="text-white/70 leading-relaxed ml-2" {...props} />
                                    ),
                                    // Strong/Bold
                                    strong: ({ node, ...props }) => (
                                      <strong className="font-semibold text-white/85" {...props} />
                                    ),
                                    // Code
                                    code: ({ node, inline, ...props }: any) =>
                                      inline ? (
                                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-white/80 border border-white/20" {...props} />
                                      ) : (
                                        <code className="block bg-white/10 p-3 rounded-lg text-xs text-white/80 border border-white/20 overflow-x-auto" {...props} />
                                      ),
                                    // Links
                                    a: ({ node, ...props }) => (
                                      <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
                                    ),
                                    // Blockquotes
                                    blockquote: ({ node, ...props }) => (
                                      <blockquote className="border-l-4 border-white/20 pl-4 italic text-white/60 my-3" {...props} />
                                    ),
                                    // Horizontal Rule
                                    hr: ({ node, ...props }) => (
                                      <hr className="border-white/10 my-4" {...props} />
                                    ),
                                    // Tables
                                    table: ({ node, ...props }) => (
                                      <div className="overflow-x-auto mb-4">
                                        <table className="min-w-full border border-white/20 rounded-lg" {...props} />
                                      </div>
                                    ),
                                    thead: ({ node, ...props }) => (
                                      <thead className="bg-white/5 border-b border-white/20" {...props} />
                                    ),
                                    th: ({ node, ...props }) => (
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-white/80 border-r border-white/10 last:border-r-0" {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                      <td className="px-4 py-2 text-sm text-white/70 border-r border-white/10 last:border-r-0 border-b border-white/10" {...props} />
                                    ),
                                  }}
                                >
                                  {page.elements}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Fallback for non-array format
                        <div className="bg-black/30 rounded-lg p-4 border border-white/20">
                          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                            {typeof pdfDetails.extracted_text === 'string'
                              ? pdfDetails.extracted_text
                              : JSON.stringify(pdfDetails.extracted_text, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="h-full overflow-auto p-6 relative z-10">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">AI-Generated Summary</h3>
                  {isLoadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-3" />
                      <p className="text-sm text-white/60">Loading AI summary...</p>
                    </div>
                  ) : detailsError ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                      <p className="text-sm text-white/60 mb-4">{detailsError}</p>
                      <button
                        onClick={fetchPdfDetails}
                        className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/30 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 text-white/80"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span className="text-sm">Retry</span>
                      </button>
                    </div>
                  ) : !pdfDetails?.ai_summary || pdfDetails.ai_summary.length === 0 ? (
                    <div className="bg-black/30 rounded-lg p-8 border border-white/20 text-center">
                      <p className="text-sm text-white/60">No AI summary available for this document.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pdfDetails.ai_summary.map((section, index) => (
                        <div key={index} className="bg-black/30 rounded-lg p-4 border border-white/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white/80">{section.header}</h4>
                            <button
                              onClick={() => {
                                setEditingSections(prev => ({
                                  ...prev,
                                  [section.header]: !prev[section.header]
                                }))
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/80"
                              title={editingSections[section.header] ? 'Cancel edit' : `Edit ${section.header}`}
                            >
                              {editingSections[section.header] ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <Edit2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {editingSections[section.header] ? (
                            <div className="space-y-2">
                              <textarea
                                value={editedSummaries[section.header] || section.summary}
                                onChange={(e) => {
                                  setEditedSummaries(prev => ({
                                    ...prev,
                                    [section.header]: e.target.value
                                  }))
                                }}
                                className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-white/40 resize-none"
                                rows={6}
                                placeholder={`Enter ${section.header.toLowerCase()}...`}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingSections(prev => ({
                                      ...prev,
                                      [section.header]: false
                                    }))
                                    setEditedSummaries(prev => ({
                                      ...prev,
                                      [section.header]: section.summary
                                    }))
                                  }}
                                  className="px-3 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSections(prev => ({
                                      ...prev,
                                      [section.header]: false
                                    }))
                                    toast.success('Changes saved')
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80 transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                              {editedSummaries[section.header] || section.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}