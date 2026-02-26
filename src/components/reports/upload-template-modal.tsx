"use client"

import { useState, useRef } from 'react'
import { Upload, Loader2, ImageIcon, X, Clock } from 'lucide-react'
import { fetchWithAuth } from '@/lib/fetch-with-auth'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'motion/react'

interface UploadTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']

export function UploadTemplateModal({ open, onOpenChange, onSuccess }: UploadTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload an image file (PNG, JPG, WebP, GIF)')
      return
    }
    setImageFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload an image file (PNG, JPG, WebP, GIF)')
      return
    }
    setImageFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }
    if (!imageFile) {
      toast.error('Please upload an image')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('content', imageFile)
      formData.append('mime_type', imageFile.type)
      formData.append('filename', name.trim())
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
        throw new Error(body?.detail?.error || body?.detail || 'Failed to upload template')
      }

      toast.success('Template uploaded successfully! It will appear shortly.')
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
    setDescription('')
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v) }}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-white/30 shadow-2xl bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl">
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
                    Add a new report template from an image
                  </p>
                </DialogHeader>

                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    /* ── Processing State ─────────────────── */
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="py-12 flex flex-col items-center gap-6 text-center"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                          <Loader2 className="w-7 h-7 text-white/60 animate-spin" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-30" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-medium text-white">Processing your template…</p>
                        <p className="text-sm text-white/40 max-w-[280px]">
                          We're analysing the image and setting up your template. This may take a moment.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-xs text-white/40">Please don't close this window</span>
                      </div>
                    </motion.div>
                  ) : (
                    /* ── Upload Form ──────────────────────── */
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
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
                          autoFocus
                          maxLength={100}
                          className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Template Image <span className="text-red-400">*</span>
                        </label>
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer
                            ${imageFile ? 'border-white/30 bg-white/5' : 'border-white/15 hover:border-white/30 hover:bg-white/5'}`}
                        >
                          {imageFile ? (
                            <>
                              <ImageIcon className="w-6 h-6 text-white/60" />
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white/80 truncate max-w-[280px]">{imageFile.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setImageFile(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                  }}
                                  className="text-white/40 hover:text-white/70 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-xs text-white/40">
                                {(imageFile.size / 1024).toFixed(1)} KB
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-white/40" />
                              <span className="text-sm text-white/60">Drop an image here or click to browse</span>
                              <span className="text-xs text-white/30">PNG, JPG, WebP, GIF supported</span>
                              <div className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <Clock className="w-3 h-3 text-amber-400/70" />
                                <span className="text-[11px] text-white/40">
                                  Currently only images are allowed — document uploads coming soon
                                </span>
                              </div>
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

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Description <span className="text-white/40 text-xs">(Optional)</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of this template…"
                          rows={2}
                          maxLength={500}
                          className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <div className="relative group">
                          <button
                            type="submit"
                            disabled={!name.trim() || !imageFile}
                            className="relative px-4 py-2 text-sm bg-black/20 hover:bg-black/10 disabled:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed text-white/90 rounded-lg border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden"
                          >
                            <div
                              className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)"
                              }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Upload Template
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
