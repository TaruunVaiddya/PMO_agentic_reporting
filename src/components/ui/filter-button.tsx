import { Filter } from 'lucide-react'

interface FilterButtonProps {
  onClick: () => void
  isActive: boolean
  activeCount?: number
}

export function FilterButton({ onClick, isActive, activeCount = 0 }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
        isActive
          ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
          : 'bg-black/10 hover:bg-black/20 border-white/10 text-white/80'
      }`}
    >
      <Filter className="w-4 h-4" />
      <span className="text-sm">Filters</span>
      {activeCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500/30 rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  )
}
