"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText, AlertCircle } from 'lucide-react'
import useSWR from 'swr'
import { ReportGrid } from '@/components/reports/report-grid'
import { ReportCardData } from '@/components/reports/report-card'
import { ReportsFilterPanel } from '@/components/reports/reports-filter-panel'
import { MetallicButton } from '@/components/ui/metallic-button'
import { BackButton } from '@/components/ui/back-button'
import { SearchBar } from '@/components/ui/search-bar'
import { FilterButton } from '@/components/ui/filter-button'
import { EmptyState } from '@/components/ui/empty-state'
import { useSearchFilter } from '@/hooks/use-search-filter'
import { fetchAllReports, Report } from '@/lib/report-api'
import { formatRelativeTime } from '@/lib/date-utils'

// Helper function to map API report to card data format
function mapReportToCardData(report: Report): ReportCardData {
  const statusMap: Record<string, 'completed' | 'processing' | 'failed'> = {
    'completed': 'completed',
    'ready': 'completed',
    'processing': 'processing',
    'generating': 'processing',
    'failed': 'failed',
    'error': 'failed',
  }

  // Safely get report name with fallback
  const reportName = report.name && typeof report.name === 'string' ? report.name : 'Untitled Report'

  // Determine relative time
  let createdAt = 'Recently'
  try {
    if (report.created_at) {
      createdAt = formatRelativeTime(report.created_at)
    }
  } catch (error) {
    console.warn('Failed to parse date:', report.created_at)
  }

  // Generate color based on report name hash for consistent colors
  const colors = [
    'from-blue-500/20 to-blue-600/10',
    'from-green-500/20 to-green-600/10',
    'from-purple-500/20 to-purple-600/10',
    'from-orange-500/20 to-orange-600/10',
    'from-pink-500/20 to-pink-600/10',
    'from-indigo-500/20 to-indigo-600/10',
  ]
  const colorIndex = reportName.length % colors.length
  const color = colors[colorIndex]

  // Default thumbnail if snapshot_url is null/undefined
  const defaultThumbnail = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80'

  // Safely get status with fallback
  const reportStatus = report.status && typeof report.status === 'string'
    ? statusMap[report.status.toLowerCase()] || 'completed'
    : 'completed'

  return {
    id: report.id || '',
    name: reportName,
    description: report.description && typeof report.description === 'string'
      ? report.description
      : 'No description available',
    thumbnail: report.snapshot_url && typeof report.snapshot_url === 'string'
      ? report.snapshot_url
      : defaultThumbnail,
    color,
    createdAt,
    status: reportStatus,
  }
}

export default function Reports() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch reports using SWR for caching and revalidation
  const { data, error, isLoading, mutate } = useSWR(
    '/reports',
    fetchAllReports,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  )

  // Transform API reports to card data format
  const userReports = useMemo(() => {
    if (!data?.reports) return []

    // Filter out reports with missing critical data (id) and then map
    return data.reports
      .filter(report => report.id) // Only include reports with valid IDs
      .map(mapReportToCardData)
  }, [data])

  const filteredReports = useSearchFilter({
    items: userReports,
    searchQuery,
    searchFields: ['name', 'description'],
    filterField: 'status',
    filterValue: filterStatus
  })

  const handleReportClick = (report: ReportCardData) => {
    // Navigate to chat session with the report
    if (!report.id) {
      console.warn('Report has no ID, cannot navigate')
      return
    }

    // Find the original report to get session_id
    const originalReport = data?.reports.find(r => r.id === report.id)

    if (!originalReport) {
      console.warn('Original report not found')
      return
    }

    if (!originalReport.session_id) {
      console.warn('Report has no session_id, cannot navigate')
      return
    }

    // Navigate to the chat session
    router.push(`/chat/${originalReport.session_id}`)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
  }

  const handleRetry = () => {
    mutate()
  }

  // Show loading skeleton
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

          {/* Loading skeleton grid */}
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

  // Show error state
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
              title="Failed to load reports"
              description={error.message || 'An error occurred while fetching your reports'}
              action={{
                label: 'Try again',
                onClick: handleRetry
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no reports at all
  if (!isLoading && !error && userReports.length === 0) {
    return (
      <div className="w-full max-h-[97vh]">
        <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
            <BackButton onClick={() => router.back()} />
            <MetallicButton onClick={() => router.push('/chat')}>
              <Plus className="w-4 h-4" />
              <span>New Report</span>
            </MetallicButton>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={FileText}
              title="No reports yet"
              description="Create your first report by starting a new chat"
              action={{
                label: 'Create Report',
                onClick: () => router.push('/chat')
              }}
            />
          </div>
        </div>
      </div>
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
              placeholder="Search reports..."
            />
            <FilterButton
              onClick={() => setShowFilters(!showFilters)}
              isActive={showFilters || filterStatus !== 'all'}
              activeCount={filterStatus !== 'all' ? 1 : 0}
            />
          </div>

          <MetallicButton onClick={() => router.push('/chat')}>
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </MetallicButton>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <ReportsFilterPanel
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          />
        )}

        {/* Results count */}
        {(searchQuery || filterStatus !== 'all') && (
          <div className="mb-4 text-sm text-white/60 flex-shrink-0">
            Found {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
            {data && ` (${data.count} total)`}
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredReports.length > 0 ? (
            <div className="pb-6">
              <ReportGrid
                reports={filteredReports}
                onReportClick={handleReportClick}
                columns={4}
              />
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No reports found"
              description={searchQuery ? `No reports match "${searchQuery}"` : 'Try adjusting your filters'}
              action={(searchQuery || filterStatus !== 'all') ? {
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
