import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-black/10 hover:bg-black/20 border border-white/10 text-white/70 hover:text-white transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  )
}
