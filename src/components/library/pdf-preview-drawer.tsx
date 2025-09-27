"use client"

import { useState, useEffect } from 'react'
import { X, Download, FileText, Calendar, HardDrive, Maximize2, RotateCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertCircle, Edit2, Save, XCircle } from 'lucide-react'
import { formatFileSize, formatRelativeTime } from '@/lib/excel-utils'
import { motion, AnimatePresence } from 'motion/react'

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
    pdf_url?: string
    total_pages?: number
    extracted_text?: string
    summary?: string
  } | null
}

export function PdfPreviewDrawer({ isOpen, onClose, document }: PdfPreviewDrawerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'summary'>('preview')
  const [isEditingKeyPoints, setIsEditingKeyPoints] = useState(false)
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [isEditingActions, setIsEditingActions] = useState(false)
  const [editableKeyPoints, setEditableKeyPoints] = useState('')
  const [editableSummary, setEditableSummary] = useState('')
  const [editableActions, setEditableActions] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1)
      setZoomLevel(100)
      setIsLoading(true)
      setHasError(false)
      setActiveTab('preview')

      // Initialize editable content
      setEditableKeyPoints('Financial performance exceeded expectations with 15% YoY growth\nMarket expansion into three new regions completed successfully\nProduct innovation pipeline shows strong potential for Q4')
      setEditableSummary(document?.summary || 'This document presents a comprehensive overview of the quarterly business performance and strategic initiatives. The report highlights significant achievements in revenue growth, operational efficiency improvements, and successful market penetration strategies. Key recommendations include continued investment in digital transformation and expansion of the product portfolio to maintain competitive advantage.')
      setEditableActions('Review budget allocation for Q4 initiatives\nSchedule stakeholder meetings for strategy alignment\nPrepare detailed implementation roadmap')

      setIsEditingKeyPoints(false)
      setIsEditingSummary(false)
      setIsEditingActions(false)

      // Simulate loading PDF
      setTimeout(() => {
        setIsLoading(false)
      }, 1500)
    }
  }, [isOpen, document])

  if (!document || !isOpen) return null

  const totalPages = document.total_pages || 10 // Mock value

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
    // Implement download logic
    console.log('Downloading PDF:', document.document_name)
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

            {/* PDF Controls - Only show when in preview tab */}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1 hover:bg-white/10 rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
                  </button>
                  <span className="text-xs text-white/80 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1 hover:bg-white/10 rounded transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>

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
              <div className="h-full overflow-auto bg-black/10 p-4 relative z-10">
                  <div className="flex items-center justify-center min-h-full">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                        <p className="text-sm text-white/60">Loading PDF...</p>
                      </div>
                    ) : hasError ? (
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <p className="text-sm text-white/60">Failed to load PDF</p>
                        <button
                          onClick={() => {
                            setIsLoading(true)
                            setHasError(false)
                            setTimeout(() => {
                              setIsLoading(false)
                            }, 1500)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/30 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 text-white/80"
                        >
                          <RotateCw className="w-4 h-4" />
                          <span className="text-sm">Retry</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        className="bg-white rounded-lg shadow-2xl transition-transform my-4"
                        style={{
                          width: '612px',
                          height: '792px',
                          transform: `scale(${zoomLevel / 100})`,
                          transformOrigin: 'center'
                        }}
                      >
                        <div className="p-8 text-gray-800">
                          <h1 className="text-2xl font-bold mb-4">PDF Page {currentPage}</h1>
                          <p className="mb-4">This is a mock PDF preview. In a real implementation, you would use a library like react-pdf or pdf.js to render actual PDF content.</p>
                          <p className="text-gray-600">Document: {document.document_name}</p>
                          <div className="mt-8 space-y-2">
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="h-full overflow-auto p-6 relative z-10">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Extracted Text</h3>
                  <div className="bg-black/30 rounded-lg p-4 border border-white/20">
                    <p className="text-sm text-white/70 leading-relaxed">
                      {document.extracted_text ||
                        `This is sample extracted text from ${document.document_name}. In a real implementation, this would show the actual text content extracted from the PDF using OCR or text extraction tools.

                        The extracted text would preserve formatting and structure as much as possible, making it easy to read and search through the document content without needing to view the PDF itself.

                        Key sections and paragraphs would be preserved, allowing users to quickly scan through the document content and find relevant information.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="h-full overflow-auto p-6 relative z-10">
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">AI-Generated Summary</h3>
                  <div className="space-y-4">
                    {/* Key Points Section */}
                    <div className="bg-black/30 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white/80">Key Points</h4>
                        <button
                          onClick={() => {
                            if (isEditingKeyPoints) {
                              setIsEditingKeyPoints(false)
                            } else {
                              setIsEditingKeyPoints(true)
                            }
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/80"
                          title={isEditingKeyPoints ? 'Cancel edit' : 'Edit key points'}
                        >
                          {isEditingKeyPoints ? <XCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                      </div>
                      {isEditingKeyPoints ? (
                        <div className="space-y-2">
                          <textarea
                            value={editableKeyPoints}
                            onChange={(e) => setEditableKeyPoints(e.target.value)}
                            className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-white/40 resize-none"
                            rows={4}
                            placeholder="Enter key points, one per line..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsEditingKeyPoints(false)}
                              className="px-3 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => setIsEditingKeyPoints(false)}
                              className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80 transition-colors"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ul className="space-y-2 text-sm text-white/70">
                          {editableKeyPoints.split('\\n').map((point, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-white/60 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Executive Summary Section */}
                    <div className="bg-black/30 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white/80">Executive Summary</h4>
                        <button
                          onClick={() => {
                            if (isEditingSummary) {
                              setIsEditingSummary(false)
                            } else {
                              setIsEditingSummary(true)
                            }
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/80"
                          title={isEditingSummary ? 'Cancel edit' : 'Edit summary'}
                        >
                          {isEditingSummary ? <XCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                      </div>
                      {isEditingSummary ? (
                        <div className="space-y-2">
                          <textarea
                            value={editableSummary}
                            onChange={(e) => setEditableSummary(e.target.value)}
                            className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-white/40 resize-none"
                            rows={6}
                            placeholder="Enter executive summary..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsEditingSummary(false)}
                              className="px-3 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => setIsEditingSummary(false)}
                              className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80 transition-colors"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-white/60 leading-relaxed">
                          {editableSummary}
                        </p>
                      )}
                    </div>

                    {/* Action Items Section */}
                    <div className="bg-black/30 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white/80">Action Items</h4>
                        <button
                          onClick={() => {
                            if (isEditingActions) {
                              setIsEditingActions(false)
                            } else {
                              setIsEditingActions(true)
                            }
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white/80"
                          title={isEditingActions ? 'Cancel edit' : 'Edit action items'}
                        >
                          {isEditingActions ? <XCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                      </div>
                      {isEditingActions ? (
                        <div className="space-y-2">
                          <textarea
                            value={editableActions}
                            onChange={(e) => setEditableActions(e.target.value)}
                            className="w-full p-3 bg-black/40 border border-white/20 rounded-lg text-sm text-white/80 placeholder-white/30 focus:outline-none focus:border-white/40 resize-none"
                            rows={4}
                            placeholder="Enter action items, one per line..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsEditingActions(false)}
                              className="px-3 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => setIsEditingActions(false)}
                              className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/80 transition-colors"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <ul className="space-y-1 text-sm text-white/60">
                          {editableActions.split('\\n').map((action, index) => (
                            <li key={index}>• {action}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
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