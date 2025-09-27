"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileText, Brain, Sparkles, FileSpreadsheet, ChevronRight, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [isHovering, setIsHovering] = useState(false)
  const router = useRouter()

  const handleGetStarted = () => {
    onOpenChange(false)
    router.push('/library')
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-0 dark shadow-2xl inset">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative"
            >
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300/10 via-white/5 to-zinc-500/10 pointer-events-none" />

              {/* Animated particles effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                <div className="absolute top-20 right-20 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-75" />
                <div className="absolute bottom-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-pulse delay-150" />
              </div>

              <div className="relative p-8">
                {/* Icon with premium glow effect */}
                <motion.div
                  initial={{ scale: 0.8, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20 rounded-full blur-xl opacity-20" />
                    <div className="relative w-20 h-20 bg-gradient-to-t from-white/10 to-black border border-border/90 rounded-2xl flex items-center justify-center ">
                      <Sparkles className="w-10 h-10 text-white/80" />
                    </div>
                  </div>
                </motion.div>

                {/* Welcome text */}
                <DialogHeader className="space-y-3 text-center mb-6">
                  <DialogTitle className="text-3xl text-center font-bold bg-gradient-to-r from-white/80 via-white to-white/80 bg-clip-text text-transparent">
                    Your Data Has Stories to Tell
                  </DialogTitle>
                  <p className="text-white/60 text-sm leading-relaxed text-center mx-auto">
                    Upload documents, provide context, and let AI help you discover insights through natural conversations and automated reporting.
                  </p>
                </DialogHeader>

                {/* Feature highlights - Grid Layout */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-black/30 to-black/30 backdrop-blur border border-white/20">
                    <FileSpreadsheet className="w-5 h-5 text-white/60 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">Start with Your Files</p>
                      <p className="text-xs text-white/50 mt-1">Drop in Excel, CSV, or PDF documents</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-black/30 to-black/30 backdrop-blur border border-white/20">
                    <Brain className="w-5 h-5 text-white/60 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">Add Your Context</p>
                      <p className="text-xs text-white/50 mt-1">Tell us what you're looking for</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-black/30 to-black/30 backdrop-blur border border-white/20">
                    <MessageSquare className="w-5 h-5 text-white/60 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">Have a Conversation</p>
                      <p className="text-xs text-white/50 mt-1">Ask anything about your data</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-black/30 to-black/30 backdrop-blur border border-white/20">
                    <FileText className="w-5 h-5 text-white/60 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">Get Instant Reports</p>
                      <p className="text-xs text-white/50 mt-1">Download insights in seconds</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleGetStarted}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  className="w-full group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] border-1 border-white/20"
                >
                  {/* Button content */}
                  <div className="relative flex items-center justify-center gap-2 bg-gradient-to-br from-black/50 to-black/20 rounded-lg px-6 py-3 transition-all group-hover:from-black/60 group-hover:to-black/30">
                    <Upload className="w-5 h-5 text-white/80" />
                    <span className="font-semibold bg-gradient-to-r from-white/70 via-white/90 to-white/70 bg-clip-text text-transparent">Upload Your First Document</span>
                    <ChevronRight className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isHovering ? 'translate-x-1' : ''}`} />
                  </div>
                </button>

                {/* Skip option */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full mt-3 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}