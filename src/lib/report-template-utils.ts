import { ReportCardData } from '@/components/reports/report-card'
import type { TemplateData } from '@/lib/constants/report-templates'

export interface TemplateResponse {
  id: string
  created_at: string
  name: string
  thumbnail_url: string | null
  description: string | null
  template_url: string | null
  category: string
}

export const categoryColors: Record<string, string> = {
  custom: 'from-white/10 to-white/5',
  business: 'from-blue-500/20 to-blue-600/10',
  finance: 'from-green-500/20 to-green-600/10',
  operations: 'from-purple-500/20 to-purple-600/10',
  marketing: 'from-orange-500/20 to-orange-600/10',
}

export const defaultTemplateThumbnail =
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center&auto=format&q=80'

export function mapApiTemplatesToTemplateData(
  apiTemplates?: TemplateResponse[] | null
): TemplateData[] {
  if (!apiTemplates || !Array.isArray(apiTemplates)) return []

  return apiTemplates
    .filter(t => t.id)
    .map(template => ({
      id: template.id,
      name: template.name || 'Untitled Template',
      description: template.description || 'No description',
      thumbnail: template.thumbnail_url || defaultTemplateThumbnail,
      color: categoryColors[template.category] || 'from-white/10 to-white/5',
      category: (template.category || 'custom') as TemplateData['category'],
    }))
}

export function mapTemplateDataToReportCardData(
  templates: TemplateData[]
): ReportCardData[] {
  return templates.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    thumbnail: template.thumbnail,
    color: template.color,
  }))
}
