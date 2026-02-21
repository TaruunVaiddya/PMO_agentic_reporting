import { ReportCardData } from '@/components/reports/report-card'

export type TemplateCategory = 'all' | 'custom' | 'business' | 'finance' | 'operations' | 'marketing'

export interface TemplateData extends ReportCardData {
  category: Exclude<TemplateCategory, 'all'>
}
