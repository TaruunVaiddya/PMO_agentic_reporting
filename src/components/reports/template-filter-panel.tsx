import { TemplateCategory } from '@/lib/constants/report-templates'

interface TemplateFilterPanelProps {
  filterCategory: TemplateCategory
  onFilterChange: (category: TemplateCategory) => void
}

export function TemplateFilterPanel({ filterCategory, onFilterChange }: TemplateFilterPanelProps) {
  const categoryOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'custom' as const, label: 'Custom' },
    { value: 'business' as const, label: 'Business' },
    { value: 'finance' as const, label: 'Finance' },
    { value: 'operations' as const, label: 'Operations' },
    { value: 'marketing' as const, label: 'Marketing' }
  ]

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex-shrink-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Category:</span>
          <div className="flex items-center gap-1">
            {categoryOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer border ${filterCategory === option.value
                    ? 'bg-[#1a2456] text-white border-[#1a2456]'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filterCategory !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="ml-auto px-3 py-1 rounded text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
