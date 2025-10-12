"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { ReportGrid } from '@/components/reports/report-grid'
import { ReportCardData } from '@/components/reports/report-card'
import { ReportsFilterPanel } from '@/components/reports/reports-filter-panel'
import { MetallicButton } from '@/components/ui/metallic-button'
import { BackButton } from '@/components/ui/back-button'
import { SearchBar } from '@/components/ui/search-bar'
import { FilterButton } from '@/components/ui/filter-button'
import { EmptyState } from '@/components/ui/empty-state'
import { useSearchFilter } from '@/hooks/use-search-filter'

export default function Reports() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Sample user reports data
  const userReports: ReportCardData[] = [
    {
      id: '1',
      name: "Q3 Sales Performance",
      description: "Quarterly sales analysis with revenue trends and top performing products",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      color: "from-blue-500/20 to-blue-600/10",
      createdAt: "2 days ago",
      status: "completed"
    },
    {
      id: '2',
      name: "Financial Overview 2024",
      description: "Comprehensive financial report with P&L statements and expense analysis",
      thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      color: "from-green-500/20 to-green-600/10",
      createdAt: "5 days ago",
      status: "completed"
    },
    {
      id: '3',
      name: "Customer Analytics Dashboard",
      description: "Customer behavior analysis and retention metrics",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      color: "from-purple-500/20 to-purple-600/10",
      createdAt: "1 week ago",
      status: "processing"
    },
    {
      id: '4',
      name: "Monthly Team Performance",
      description: "Team productivity metrics and KPI tracking for November",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      color: "from-orange-500/20 to-orange-600/10",
      createdAt: "2 weeks ago",
      status: "completed"
    },
    {
      id: '5',
      name: "Inventory Analysis Report",
      description: "Stock levels, turnover rates, and reorder recommendations",
      thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      color: "from-white/10 to-white/5",
      createdAt: "3 weeks ago",
      status: "completed"
    },
    {
      id: '6',
      name: "Marketing Campaign Results",
      description: "Campaign performance metrics and ROI analysis",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      color: "from-white/10 to-white/5",
      createdAt: "1 month ago",
      status: "completed"
    }
  ]

  const filteredReports = useSearchFilter({
    items: userReports,
    searchQuery,
    searchFields: ['name', 'description'],
    filterField: 'status',
    filterValue: filterStatus
  })

  const handleReportClick = () => {
    // TODO: Navigate to report details or preview
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
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
