"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, AlertCircle, Upload, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { ReportGrid } from '@/components/reports/report-grid'
import { TemplateFilterPanel } from '@/components/reports/template-filter-panel'
import { MetallicButton } from '@/components/ui/metallic-button'
import { BackButton } from '@/components/ui/back-button'
import { SearchBar } from '@/components/ui/search-bar'
import { FilterButton } from '@/components/ui/filter-button'
import { EmptyState } from '@/components/ui/empty-state'
import { UploadTemplateModal } from '@/components/reports/upload-template-modal'
import { TemplateCategory, TemplateData } from '@/lib/constants/report-templates'
import { ReportCardData } from '@/components/reports/report-card'
import { useSearchFilter } from '@/hooks/use-search-filter'
import { fetcher } from '@/lib/get-fetcher'
import { fetchWithAuth } from '@/lib/fetch-with-auth'
import { toast } from 'sonner'

interface TemplateResponse {
  id: string
  created_at: string
  name: string
  thumbnail_url: string | null
  description: string | null
  template_url: string | null
  category: string
}

// Color mapping per category
const categoryColors: Record<string, string> = {
  custom: 'from-white/10 to-white/5',
  business: 'from-blue-500/20 to-blue-600/10',
  finance: 'from-green-500/20 to-green-600/10',
  operations: 'from-purple-500/20 to-purple-600/10',
  marketing: 'from-orange-500/20 to-orange-600/10',
}

export default function ReportTemplates() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<TemplateCategory>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Fetch all templates from API
  const { data: apiTemplates, error, isLoading, mutate } = useSWR<TemplateResponse[]>(
    '/report-templates',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  )

  // Transform API response to TemplateData format
  const templates: TemplateData[] = useMemo(() => {
    if (!apiTemplates || !Array.isArray(apiTemplates)) return []

    return apiTemplates
      .filter(t => t.id)
      .map(template => ({
        id: template.id,
        name: template.name || 'Untitled Template',
        description: template.description || 'No description',
        thumbnail: template.thumbnail_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
        color: categoryColors[template.category] || 'from-white/10 to-white/5',
        category: (template.category || 'custom') as TemplateData['category'],
      }))
  }, [apiTemplates])

  // Filter by search + category
  const filteredTemplates = useSearchFilter({
    items: templates,
    searchQuery,
    searchFields: ['name', 'description'],
    filterField: 'category',
    filterValue: filterCategory,
  })

  const handleTemplateClick = (report: ReportCardData) => {
    if (!report.id) return
    const params = new URLSearchParams({
      template_id: report.id,
      template_name: report.name,
    })
    router.push(`/chat?${params.toString()}`)
  }

  const handleDeleteTemplate = async (report: ReportCardData) => {
    if (!report.id) return

    try {
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/report-templates/${report.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.detail?.error || body?.detail || 'Failed to delete template')
      }

      // Optimistically remove from cache
      mutate(
        (current) => current?.filter(t => t.id !== report.id),
        { revalidate: false }
      )

      toast.success('Template deleted')
    } catch (err) {
      console.error('Failed to delete template:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterCategory('all')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-h-[97vh]">
        <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <BackButton onClick={() => router.back()} />
              <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="w-full h-32 bg-white/5 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                    <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-h-[97vh]">
        <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            <BackButton onClick={() => router.back()} />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={AlertCircle}
              title="Failed to load templates"
              description={error.message || 'An error occurred while fetching templates'}
              action={{
                label: 'Try again',
                onClick: () => mutate()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Empty state — no templates at all
  if (templates.length === 0) {
    return (
      <>
        <div className="w-full max-h-[97vh]">
          <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
              <BackButton onClick={() => router.back()} />
              <div className="flex items-center gap-2">
                <MetallicButton onClick={() => router.push('/chat')}>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Template</span>
                </MetallicButton>
                <MetallicButton onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-4 h-4" />
                  <span>Upload Template</span>
                </MetallicButton>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={FileText}
                title="No templates yet"
                description="Generate or upload your first report template"
              />
            </div>
          </div>
        </div>
        <UploadTemplateModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onSuccess={() => mutate()}
        />
      </>
    )
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

          <div className="flex items-center gap-2">
            <MetallicButton onClick={() => router.push('/chat')}>
              <Sparkles className="w-4 h-4" />
              <span>Generate Template</span>
            </MetallicButton>
            <MetallicButton onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4" />
              <span>Upload Template</span>
            </MetallicButton>
          </div>
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
                onDelete={handleDeleteTemplate}
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
      <UploadTemplateModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
