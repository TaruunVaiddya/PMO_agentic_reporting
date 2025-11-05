"use client"

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, X, FileText, FileSpreadsheet } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { postFetcher } from '@/lib/post-fetcher'
import { Loader2 } from 'lucide-react'

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId?: string | null
  onOptimisticUpdate?: (newDocuments: any[]) => void
}

export function UploadModal({ open, onOpenChange, collectionId, onOptimisticUpdate }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [userSuggestion, setUserSuggestion] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number>(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' ||
              file.name.endsWith('.xlsx') ||
              file.name.endsWith('.xls')
    )
    setFiles(prev => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getDocumentType = (file: File) => {
    const name = file.name.toLowerCase()
    if (name.endsWith('.pdf')) return 'PDF'
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'Excel'
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Word'
    return 'OTHER'
  }

  const getExtension = (file: File) => {
    const idx = file.name.lastIndexOf('.')
    return idx !== -1 ? file.name.substring(idx) : ''
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    setError(null)
    setSuccessCount(0)

    const optimisticDocuments: any[] = []

    try {
      for (const file of files) {
        // 1) Get signed URL
        const signed = await postFetcher('/documents/get-upload-signed-url', {
          file_name: file.name,
        })
        const uploadUrl = signed?.upload_url as string
        const fileKey = signed?.file_key as string
        if (!uploadUrl || !fileKey) {
          throw new Error('Failed to get upload URL')
        }

        // 2) Upload the file to storage
        const putResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        })
        if (!putResp.ok) {
          throw new Error(`Upload failed: ${putResp.statusText}`)
        }

        // 3) Register in DB
        const payload = [
          {
            document_type: getDocumentType(file),
            document_name: file.name,
            user_suggestion: userSuggestion || null,
            extension: getExtension(file),
            document_size: file.size,
            document_key: fileKey,
            ...(collectionId && { collection_id: collectionId }),
          },
        ]

        try {
          const response = await postFetcher('/add_documents', payload)
          const documentIds = response?.document_ids || []
          const documentId = documentIds[0] // Since we're uploading one at a time

          // Create optimistic document object with the returned ID
          optimisticDocuments.push({
            document_id: documentId,
            document_name: file.name,
            document_type: getDocumentType(file),
            processing_status: 'NOT_STARTED',
            percentage_completion: 0,
            document_size: file.size,
            upload_date: new Date().toISOString(),
            user_suggestion: userSuggestion || null,
            extension: getExtension(file),
            document_key: fileKey,
          })

          setSuccessCount((c) => c + 1)
        } catch (dbErr) {
          // Best-effort cleanup: attempt DELETE if supported by the same signed URL
          try {
            await fetch(uploadUrl, { method: 'DELETE' })
          } catch (_) {
            // ignore
          }
          throw dbErr instanceof Error ? dbErr : new Error('Failed to register document')
        }
      }

      // All successful - optimistically update the UI
      if (optimisticDocuments.length > 0) {
        onOptimisticUpdate?.(optimisticDocuments)
      }

      setFiles([])
      setUserSuggestion('')
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border border-white/30 shadow-2xl bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="p-6">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl font-semibold text-white">
                    Upload Documents
                  </DialogTitle>
                  <p className="text-sm text-neutral-400 mt-1">
                    Upload PDF or Excel files for AI analysis
                  </p>
                </DialogHeader>

                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                    isDragging
                      ? 'border-blue-500/50 bg-blue-500/5'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.xlsx,.xls"
                    multiple
                    onChange={handleFileSelect}
                  />

                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-t from-white/10 to-white/20 border border-white/20 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-white/70" />
                    </div>
                    <p className="text-sm font-medium text-white/90 mb-1">
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-white/50">
                      PDF and Excel files only (Max 10MB)
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-t from-white/10 to-white/20 border border-white/20 flex items-center justify-center">
                            {file.type === 'application/pdf' ? (
                              <FileText className="w-4 h-4 text-white/70" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4 text-white/70" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-white/90 truncate max-w-[300px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-white/50">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4 text-white/50" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Analysis Focus (Optional)
                    </label>
                    <textarea
                      value={userSuggestion}
                      onChange={(e) => setUserSuggestion(e.target.value)}
                      placeholder="Tell us what you're looking for in these documents... e.g., 'Focus on financial trends and key metrics' or 'Extract customer feedback themes'"
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-white/40 mt-1">
                      {userSuggestion.length}/500 characters
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (isUploading) return
                      setFiles([])
                      setUserSuggestion('')
                      setError(null)
                      onOpenChange(false)
                    }}
                    className="px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors cursor-pointer disabled:opacity-50"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <div className="relative group">
                    <button
                      onClick={handleUpload}
                      disabled={files.length === 0 || isUploading}
                      className="relative px-4 py-2 text-sm bg-black/20 hover:bg-black/10 disabled:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed text-white/90 rounded-lg border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div
                        className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.12) 50%, rgba(29,78,216,0) 100%)"
                        }}
                      />
                      <span className="relative z-10 flex items-center gap-2">
                        {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isUploading ? `Uploading... ${successCount}/${files.length}` : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}