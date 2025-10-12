"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReportGrid } from '@/components/reports/report-grid'
import { ReportCardData } from '@/components/reports/report-card'
import { Search, Filter, Plus, X, ArrowLeft } from 'lucide-react'
import { MetallicButton } from '@/components/ui/metallic-button'

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

  // Filter reports based on search and status
  const filteredReports = userReports.filter(report => {
    const matchesSearch = searchQuery === '' ||
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || report.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleReportClick = (report: ReportCardData) => {
    console.log('Report clicked:', report)
    // TODO: Navigate to report details or preview
  }

  const handleNewReport = () => {
    router.push('/chat')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="w-full max-h-[97vh]">
      <div className="bg-gray-900/10 py-6 px-8 w-full h-full flex flex-col rounded-xl border-t border-white/10">
        {/* Top Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-black/10 hover:bg-black/20 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-black/10 border border-white/10 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  showFilters || filterStatus !== 'all'
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                    : 'bg-black/10 hover:bg-black/20 border-white/10 text-white/80'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
                {filterStatus !== 'all' && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500/30 rounded-full">
                    1
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* New Report Button */}
          <div className="flex items-center gap-3">
            <MetallicButton onClick={handleNewReport}>
              <Plus className="w-4 h-4" />
              <span>New Report</span>
            </MetallicButton>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-card rounded-lg border border-white/10 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Status:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                      filterStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/10 text-white/60 hover:bg-black/20'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('completed')}
                    className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                      filterStatus === 'completed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/10 text-white/60 hover:bg-black/20'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setFilterStatus('processing')}
                    className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                      filterStatus === 'processing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/10 text-white/60 hover:bg-black/20'
                    }`}
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => setFilterStatus('failed')}
                    className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                      filterStatus === 'failed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/10 text-white/60 hover:bg-black/20'
                    }`}
                  >
                    Failed
                  </button>
                </div>
              </div>

              {filterStatus !== 'all' && (
                <button
                  onClick={() => setFilterStatus('all')}
                  className="ml-auto px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">
                No reports found
              </h3>
              <p className="text-sm text-white/50 mb-4">
                {searchQuery
                  ? `No reports match "${searchQuery}"`
                  : 'Try adjusting your filters'}
              </p>
              {(searchQuery || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
