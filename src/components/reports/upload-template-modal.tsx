"use client"

import { useState, useRef } from 'react'
import { Upload, Loader2, FileCode, X } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetch-with-auth'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'motion/react'

const CATEGORIES = [
  { value: 'custom', label: 'Custom' },
  { value: 'business', label: 'Business' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'marketing', label: 'Marketing' },
]

interface UploadTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadTemplateModal({ open, onOpenChange, onSuccess }: UploadTemplateModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('custom')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.html') && file.type !== 'text/html') {
      toast.error('Please upload an HTML file')
      return
    }
    setHtmlFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.html') && file.type !== 'text/html') {
      toast.error('Please upload an HTML file')
      return
    }
    setHtmlFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }
    if (!htmlFile) {
      toast.error('Please upload an HTML file')
      return
    }

    setIsSubmitting(true)
    try {
      const htmlContent = await htmlFile.text()

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/report-templates`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            code: { html: htmlContent },
            category,
            description: description.trim() || null,
            thumbnail_url: thumbnailUrl.trim() || null,
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.detail?.error || body?.detail || 'Failed to upload template')
      }

      toast.success('Template uploaded successfully')
      handleClose()
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setName('')
    setCategory('custom')
    setDescription('')
    setThumbnailUrl('')
    setHtmlFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border border-white/30 shadow-2xl bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl">
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
                    Upload Template
                  </DialogTitle>
                  <p className="text-sm text-neutral-400 mt-1">
                    Upload an HTML file to use as a report template
                  </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Template Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Q4 Financial Report"
                      disabled={isSubmitting}
                      autoFocus
                      maxLength={100}
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} className="bg-neutral-900 text-white">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* HTML File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      HTML File <span className="text-red-400">*</span>
                    </label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer
                        ${htmlFile ? 'border-white/30 bg-white/5' : 'border-white/15 hover:border-white/30 hover:bg-white/5'}
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      {htmlFile ? (
                        <>
                          <FileCode className="w-6 h-6 text-white/60" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/80 truncate max-w-[280px]">{htmlFile.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setHtmlFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                              }}
                              className="text-white/40 hover:text-white/70 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xs text-white/40">
                            {(htmlFile.size / 1024).toFixed(1)} KB
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-white/40" />
                          <span className="text-sm text-white/60">Drop your HTML file here or click to browse</span>
                          <span className="text-xs text-white/30">.html files only</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html,text/html"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Description <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this template..."
                      disabled={isSubmitting}
                      rows={2}
                      maxLength={500}
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Thumbnail URL */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Thumbnail URL <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://example.com/thumbnail.png"
                      disabled={isSubmitting}
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <div className="relative group">
                      <button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || !htmlFile}
                        className="relative px-4 py-2 text-sm bg-black/20 hover:bg-black/10 disabled:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed text-white/90 rounded-lg border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.12) 50%, rgba(29,78,216,0) 100%)"
                          }}
                        />
                        <span className="relative z-10 flex items-center gap-2">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload Template
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
