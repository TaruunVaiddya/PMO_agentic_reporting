interface ReportsFilterPanelProps {
  filterStatus: 'all' | 'completed' | 'processing' | 'failed'
  onFilterChange: (status: 'all' | 'completed' | 'processing' | 'failed') => void
}

export function ReportsFilterPanel({ filterStatus, onFilterChange }: ReportsFilterPanelProps) {
  const statusOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'completed' as const, label: 'Completed' },
    { value: 'processing' as const, label: 'Processing' },
    { value: 'failed' as const, label: 'Failed' }
  ]

  return (
    <div className="mb-6 p-4 bg-card rounded-lg border border-white/10 flex-shrink-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Status:</span>
          <div className="flex items-center gap-1">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                  filterStatus === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-black/10 text-white/60 hover:bg-black/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filterStatus !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="ml-auto px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
