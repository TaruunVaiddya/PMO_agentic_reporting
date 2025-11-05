"use client"

import { useState } from 'react'
import { FolderPlus, Loader2 } from 'lucide-react'
import { postFetcher } from '@/lib/post-fetcher'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'motion/react'

interface CreateCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateCollectionModal({ open, onOpenChange, onSuccess }: CreateCollectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Collection name is required')
      return
    }

    setIsCreating(true)
    try {
      await postFetcher('/create_collections', {
        name: name.trim(),
        description: description.trim() || undefined
      })

      toast.success('Collection created successfully')
      setName('')
      setDescription('')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create collection')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setName('')
      setDescription('')
      onOpenChange(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                    Create New Collection
                  </DialogTitle>
                  <p className="text-sm text-neutral-400 mt-1">
                    Organize your documents into collections
                  </p>
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="collection-name" className="block text-sm font-medium text-white/80 mb-2">
                      Collection Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="collection-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Financial Reports Q4"
                      disabled={isCreating}
                      autoFocus
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      maxLength={100}
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label htmlFor="collection-description" className="block text-sm font-medium text-white/80 mb-2">
                      Description <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      id="collection-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a brief description for this collection..."
                      disabled={isCreating}
                      rows={3}
                      className="w-full p-3 bg-black/20 border border-white/20 focus:border-white/40 rounded-lg text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      maxLength={500}
                    />
                    <p className="text-xs text-white/40 mt-1">
                      {description.length}/500 characters
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isCreating}
                      className="px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <div className="relative group">
                      <button
                        type="submit"
                        disabled={isCreating || !name.trim()}
                        className="relative px-4 py-2 text-sm bg-black/20 hover:bg-black/10 disabled:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed text-white/90 rounded-lg border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 z-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.12) 50%, rgba(29,78,216,0) 100%)"
                          }}
                        />
                        <span className="relative z-10 flex items-center gap-2">
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <FolderPlus className="h-4 w-4" />
                              Create Collection
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
