"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { ReportGrid } from '@/components/reports/report-grid'
import { TemplateFilterPanel } from '@/components/reports/template-filter-panel'
import { MetallicButton } from '@/components/ui/metallic-button'
import { BackButton } from '@/components/ui/back-button'
import { SearchBar } from '@/components/ui/search-bar'
import { FilterButton } from '@/components/ui/filter-button'
import { EmptyState } from '@/components/ui/empty-state'
import { REPORT_TEMPLATES, TemplateCategory, TemplateData } from '@/lib/constants/report-templates'
import { useSearchFilter } from '@/hooks/use-search-filter'
import { fetcher } from '@/lib/get-fetcher'

interface CustomTemplateResponse {
  id: string
  created_at: string
  name: string
  thumbnail_url: string
  description: string
  template_url: string
}

export default function ReportTemplates() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<TemplateCategory>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<TemplateData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch custom templates on mount
  useEffect(() => {
    const fetchCustomTemplates = async () => {
      try {
        setIsLoading(true)
        const response: CustomTemplateResponse[] = await fetcher('/report-templates')

        // Transform API response to match TemplateData structure
        const transformedTemplates: TemplateData[] = response.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          thumbnail: template.thumbnail_url,
          color: 'from-white/10 to-white/5', // Default color for custom templates
          category: 'custom' // Mark as custom template
        }))

        setCustomTemplates(transformedTemplates)
      } catch (error) {
        console.error('Failed to fetch custom templates:', error)
        setCustomTemplates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomTemplates()
  }, [])

  // Combine custom templates (first) with default templates
  const allTemplates = [...customTemplates, ...REPORT_TEMPLATES]

  const filteredTemplates = useSearchFilter({
    items: allTemplates,
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
            <span>Upload Custom</span>
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
        {!isLoading && (searchQuery || filterCategory !== 'all') && (
          <div className="mb-4 text-sm text-white/60 flex-shrink-0">
            Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white/80 animate-spin" />
                <p className="text-sm text-white/60">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length > 0 ? (
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
