"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { ReportGrid } from '@/components/reports/report-grid'
import { TemplateFilterPanel } from '@/components/reports/template-filter-panel'
import { MetallicButton } from '@/components/ui/metallic-button'
import { BackButton } from '@/components/ui/back-button'
import { SearchBar } from '@/components/ui/search-bar'
import { FilterButton } from '@/components/ui/filter-button'
import { EmptyState } from '@/components/ui/empty-state'
import { REPORT_TEMPLATES, TemplateCategory } from '@/lib/constants/report-templates'
import { useSearchFilter } from '@/hooks/use-search-filter'

export default function ReportTemplates() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<TemplateCategory>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredTemplates = useSearchFilter({
    items: REPORT_TEMPLATES,
    searchQuery,
    searchFields: ['name', 'description'],
    filterField: 'category',
    filterValue: filterCategory
  })

  const handleTemplateClick = () => {
    // TODO: Navigate to create report from template or show template details
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterCategory('all')
  }

  return (
    <div className="w-full max-h-[97vh]">
      <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
        {/* Top Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <BackButton onClick={() => router.back()} />
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search templates..."
            />
            <FilterButton
              onClick={() => setShowFilters(!showFilters)}
              isActive={showFilters || filterCategory !== 'all'}
              activeCount={filterCategory !== 'all' ? 1 : 0}
            />
          </div>

          <MetallicButton onClick={() => router.push('/chat')}>
            <Plus className="w-4 h-4" />
            <span>Create Custom</span>
          </MetallicButton>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <TemplateFilterPanel
            filterCategory={filterCategory}
            onFilterChange={setFilterCategory}
          />
        )}

        {/* Results count */}
        {(searchQuery || filterCategory !== 'all') && (
          <div className="mb-4 text-sm text-white/60 flex-shrink-0">
            Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredTemplates.length > 0 ? (
            <div className="pb-6">
              <ReportGrid
                reports={filteredTemplates}
                onReportClick={handleTemplateClick}
                columns={4}
              />
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No templates found"
              description={searchQuery ? `No templates match "${searchQuery}"` : 'Try adjusting your filters'}
              action={(searchQuery || filterCategory !== 'all') ? {
                label: 'Clear all filters',
                onClick: clearAllFilters
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
