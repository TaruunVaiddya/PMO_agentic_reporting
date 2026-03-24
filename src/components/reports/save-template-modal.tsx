"use client"

import { useEffect, useRef, useState } from 'react'
import { Loader2, ImageIcon, Save, Upload, X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuth } from '@/lib/fetch-with-auth'
import { capturePreviewThumbnailFromIframe, type PreviewOrientation } from '@/lib/pdf-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'motion/react'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']

interface SaveTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  title?: string
  getPreviewIframe?: () => HTMLIFrameElement | null
  orientation?: PreviewOrientation
}

export function SaveTemplateModal({
  open,
  onOpenChange,
  onSuccess,
  title = '',
  getPreviewIframe,
  orientation = 'original',
}: SaveTemplateModalProps) {
  const [name, setName] = useState(title)
  const [description, setDescription] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(title)
    setDescription('')
    setThumbnailFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open, title])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload an image file (PNG, JPG, WebP, GIF)')
      return
    }
    setThumbnailFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload an image file (PNG, JPG, WebP, GIF)')
      return
    }
    setThumbnailFile(file)
  }

  const handleClose = () => {
    if (isSubmitting) return
    setName(title)
    setDescription('')
    setThumbnailFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Template name is required')
      return
    }

    setIsSubmitting(true)
    try {
      let fileToUpload = thumbnailFile
      if (!fileToUpload) {
        const previewIframe = getPreviewIframe?.()
        if (!previewIframe) {
          throw new Error('Preview is not ready yet. Please try again in a moment.')
        }
        fileToUpload = await capturePreviewThumbnailFromIframe(previewIframe, trimmedName, orientation)
      }

      const formData = new FormData()
      formData.append('content', fileToUpload)
      formData.append('mime_type', fileToUpload.type)
      formData.append('filename', trimmedName)
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-template`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.detail?.error || body?.detail || 'Failed to save template')
      }

      toast.success('Template saved successfully!')
      onSuccess()
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v) }}>
          <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              <div className="p-6">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl font-semibold text-slate-900">
                    Save as Template
                  </DialogTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Save the current preview as a reusable template.
                  </p>
                </DialogHeader>

                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="py-12 flex flex-col items-center gap-6 text-center"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center">
                          <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-slate-100 animate-ping opacity-30" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-medium text-slate-900">Saving your template…</p>
                        <p className="text-sm text-slate-500 max-w-[280px]">
                          We’re capturing the preview image and saving the template metadata.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">Please don&apos;t close this window</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Template Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Q4 Financial Summary"
                          autoFocus
                          maxLength={100}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Thumbnail Image <span className="text-slate-400 text-xs">(Optional)</span>
                        </label>
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer
                            ${thumbnailFile ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          {thumbnailFile ? (
                            <>
                              <ImageIcon className="w-6 h-6 text-slate-500" />
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-700 truncate max-w-[280px]">{thumbnailFile.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setThumbnailFile(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                  }}
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-xs text-slate-400">
                                {(thumbnailFile.size / 1024).toFixed(1)} KB
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-slate-400" />
                              <span className="text-sm text-slate-500">Drop an image here or click to browse</span>
                              <span className="text-xs text-slate-400">If you skip this, we’ll use the current preview snapshot</span>
                            </>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Description <span className="text-slate-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of this template…"
                          rows={2}
                          maxLength={500}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <div className="relative group">
                          <button
                            type="submit"
                            disabled={!name.trim()}
                            className="relative px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg border border-slate-200 transition-all duration-300 cursor-pointer overflow-hidden"
                          >
                            <div
                              className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                              style={{
                                background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)"
                              }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                              <Save className="h-4 w-4" />
                              Save Template
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
