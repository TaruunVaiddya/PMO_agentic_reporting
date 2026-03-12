import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  onClick: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#1a2456] transition-colors shadow-sm"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  )
}
