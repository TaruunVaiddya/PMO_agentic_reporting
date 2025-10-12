import { ReportCardData } from '@/components/reports/report-card'

export type TemplateCategory = 'all' | 'business' | 'finance' | 'operations' | 'marketing'

export interface TemplateData extends ReportCardData {
  category: Exclude<TemplateCategory, 'all'>
}

export const REPORT_TEMPLATES: TemplateData[] = [
  {
    id: '1',
    name: "Sales Dashboard",
    description: "Revenue trends and performance metrics with top products analysis",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-blue-500/20 to-blue-600/10",
    category: "business"
  },
  {
    id: '2',
    name: "Financial Report",
    description: "P&L statements and financial analysis with expense breakdowns",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-green-500/20 to-green-600/10",
    category: "finance"
  },
  {
    id: '3',
    name: "Performance Analytics",
    description: "KPI tracking and metrics analysis for business performance",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-purple-500/20 to-purple-600/10",
    category: "business"
  },
  {
    id: '4',
    name: "Monthly Summary",
    description: "Monthly business overview report with key metrics and highlights",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-orange-500/20 to-orange-600/10",
    category: "business"
  },
  {
    id: '5',
    name: "Marketing Campaign Report",
    description: "Campaign performance analysis with ROI and engagement metrics",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-white/10 to-white/5",
    category: "marketing"
  },
  {
    id: '6',
    name: "Inventory Management",
    description: "Stock levels, turnover rates, and reorder recommendations",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-white/10 to-white/5",
    category: "operations"
  },
  {
    id: '7',
    name: "Customer Analytics",
    description: "Customer behavior patterns and retention metrics analysis",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-blue-500/20 to-blue-600/10",
    category: "marketing"
  },
  {
    id: '8',
    name: "Budget Analysis",
    description: "Comprehensive budget tracking with variance analysis",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-green-500/20 to-green-600/10",
    category: "finance"
  },
  {
    id: '9',
    name: "Team Performance",
    description: "Employee productivity metrics and team KPI tracking",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-purple-500/20 to-purple-600/10",
    category: "operations"
  },
  {
    id: '10',
    name: "Quarterly Business Review",
    description: "Comprehensive quarterly analysis with strategic insights",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-orange-500/20 to-orange-600/10",
    category: "business"
  },
  {
    id: '11',
    name: "Cash Flow Statement",
    description: "Detailed cash flow analysis with projections and trends",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-green-500/20 to-green-600/10",
    category: "finance"
  },
  {
    id: '12',
    name: "Social Media Analytics",
    description: "Social media engagement and growth metrics tracking",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    color: "from-blue-500/20 to-blue-600/10",
    category: "marketing"
  }
]
