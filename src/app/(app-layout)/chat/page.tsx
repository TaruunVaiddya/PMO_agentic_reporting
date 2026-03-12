"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react'
import { fetcher } from '@/lib/get-fetcher'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
}

interface Project {
  project_id: number
  project_name: string
}

interface Program {
  program_id: number
  program_name: string
  projects: Project[]
}

interface Portfolio {
  portfolio_id: number
  portfolio_name: string
  programs: Program[]
  standalone_projects: Project[]
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'buildReportRequest'

export default function ChatWizardPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set())

  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [portfoliosLoading, setPortfoliosLoading] = useState(true)
  const [selectedPortfolios, setSelectedPortfolios] = useState<Set<number>>(new Set())
  const [selectedPrograms, setSelectedPrograms] = useState<Set<number>>(new Set())
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set())
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<number>>(new Set())
  const [activePortfolioId, setActivePortfolioId] = useState<number | null>(null)

  useEffect(() => {
    fetcher('/report-templates')
      .then(setTemplates)
      .catch(e => console.error(e))
      .finally(() => setTemplatesLoading(false))
  }, [])

  useEffect(() => {
    fetcher('/p3m-reporting-data')
      .then((data: Portfolio[]) => {
        setPortfolios(data)
        setExpandedPortfolios(new Set(data.map(p => p.portfolio_id)))
      })
      .catch(e => console.error(e))
      .finally(() => setPortfoliosLoading(false))
  }, [])

  const toggleTemplate = (id: string) =>
    setSelectedTemplateIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const getAllProjectIdsInProgram = useCallback((program: Program) =>
    (program.projects || []).map(p => p.project_id), [])

  const getAllProgramIdsInPortfolio = useCallback((portfolio: Portfolio) =>
    (portfolio.programs || []).map(p => p.program_id), [])

  const getAllProjectIdsInPortfolio = useCallback((portfolio: Portfolio) => [
    ...(portfolio.programs || []).flatMap(pg => (pg.projects || []).map(p => p.project_id)),
    ...(portfolio.standalone_projects || []).map(p => p.project_id),
  ], [])

  const toggleExpand = useCallback((id: number) =>
    setExpandedPortfolios(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    }), [])

  const switchToPortfolio = useCallback((portfolioId: number) => {
    setSelectedPortfolios(new Set())
    setSelectedPrograms(new Set())
    setSelectedProjects(new Set())
    setActivePortfolioId(portfolioId)
  }, [])

  const handlePortfolioToggle = useCallback((portfolio: Portfolio) => {
    if (selectedPortfolios.has(portfolio.portfolio_id)) {
      setSelectedPortfolios(new Set())
      setSelectedPrograms(new Set())
      setSelectedProjects(new Set())
      setActivePortfolioId(null)
    } else {
      setActivePortfolioId(portfolio.portfolio_id)
      setSelectedPortfolios(new Set([portfolio.portfolio_id]))
      setSelectedPrograms(new Set(getAllProgramIdsInPortfolio(portfolio)))
      setSelectedProjects(new Set(getAllProjectIdsInPortfolio(portfolio)))
    }
  }, [selectedPortfolios, getAllProgramIdsInPortfolio, getAllProjectIdsInPortfolio])

  const handleProgramToggle = useCallback((program: Program, portfolio: Portfolio) => {
    if (activePortfolioId !== null && activePortfolioId !== portfolio.portfolio_id) {
      switchToPortfolio(portfolio.portfolio_id)
      setSelectedPrograms(new Set([program.program_id]))
      setSelectedProjects(new Set(getAllProjectIdsInProgram(program)))
      return
    }
    if (activePortfolioId === null) setActivePortfolioId(portfolio.portfolio_id)
    const isSelected = selectedPrograms.has(program.program_id)
    setSelectedPrograms(prev => {
      const next = new Set(prev)
      isSelected ? next.delete(program.program_id) : next.add(program.program_id)
      return next
    })
    const ids = getAllProjectIdsInProgram(program)
    setSelectedProjects(prev => {
      const next = new Set(prev)
      ids.forEach(id => isSelected ? next.delete(id) : next.add(id))
      return next
    })
  }, [activePortfolioId, selectedPrograms, getAllProjectIdsInProgram, switchToPortfolio])

  const handleProjectToggle = useCallback((projectId: number, portfolio: Portfolio) => {
    if (activePortfolioId !== null && activePortfolioId !== portfolio.portfolio_id) {
      switchToPortfolio(portfolio.portfolio_id)
      setSelectedProjects(new Set([projectId]))
      return
    }
    if (activePortfolioId === null) setActivePortfolioId(portfolio.portfolio_id)
    setSelectedProjects(prev => {
      const next = new Set(prev)
      next.has(projectId) ? next.delete(projectId) : next.add(projectId)
      return next
    })
  }, [activePortfolioId, selectedProjects, switchToPortfolio])

  const selectAll = useCallback(() => {
    setSelectedPortfolios(new Set(portfolios.map(p => p.portfolio_id)))
    setSelectedPrograms(new Set(portfolios.flatMap(p => (p.programs || []).map(pg => pg.program_id))))
    setSelectedProjects(new Set(portfolios.flatMap(getAllProjectIdsInPortfolio)))
    setActivePortfolioId(null)
  }, [portfolios, getAllProjectIdsInPortfolio])

  const counts = useMemo(() => ({
    portfolios: selectedPortfolios.size,
    programs: selectedPrograms.size,
    projects: selectedProjects.size,
  }), [selectedPortfolios, selectedPrograms, selectedProjects])

  const canSave = title.trim().length > 0 && selectedTemplateIds.size > 0

  const handleSave = () => {
    const chat_id = uuidv4()
    const session_id = uuidv4()

    // Determine portfolio_id (single selection)
    const portfolioIdNum = Array.from(selectedPortfolios)[0] ?? null
    const portfolio_id = portfolioIdNum ? String(portfolioIdNum) : null

    const program_ids = Array.from(selectedPrograms).map(String)
    const project_ids = Array.from(selectedProjects).map(String)

    const payload = {
      chat_id,
      session_id,
      report_name: title.trim(),
      description: description.trim(),
      selected_template_ids: Array.from(selectedTemplateIds),
      portfolio_id,
      program_ids: program_ids.length > 0 ? program_ids : null,
      project_ids: project_ids.length > 0 ? project_ids : null,
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    router.push('/chat/build-report')
  }

  // All standalone projects across all portfolios for the bottom section
  const allStandaloneProjects = useMemo(() =>
    portfolios.flatMap(p =>
      (p.standalone_projects || []).map(proj => ({ ...proj, portfolio: p }))
    ), [portfolios])

  return (
    <div className="w-full h-full overflow-y-auto bg-white border-1 border-black/10 rounded-md">
      <div className="max-w-[92%] mx-auto px-4 py-5 bg-white">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <button className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
              <ArrowLeft size={13} />
            </button>
            <h1 className="text-sm font-semibold text-slate-800">Create Report Pack</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-[#4c35c9] hover:bg-[#3d28b0] disabled:opacity-40 text-white px-5 h-8 rounded text-xs font-semibold shadow-none"
          >
            Build Report
          </Button>
        </div>

        {/* ── Title + Description ── */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              Report Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-white border-slate-300 rounded h-8 text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#4c35c9] focus-visible:border-[#4c35c9]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">Description</label>
            <Textarea
              placeholder="Enter Portfolio Dossier Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-white border-slate-300 rounded text-xs resize-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#4c35c9] focus-visible:border-[#4c35c9]"
              rows={2}
              maxLength={3000}
            />
            <p className="text-[10px] text-slate-400 text-right">{3000 - description.length} characters remaining</p>
          </div>
        </div>

        {/* ── Divider ── */}
        <hr className="border-slate-200 mb-5" />

        {/* ── Template Selection ── */}
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-700 mb-3">
            Select one or more report templates <span className="text-red-500">*</span>
          </p>

          {templatesLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400">Loading templates...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-2.5">
              {templates.map(template => (
                <label key={template.id} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={selectedTemplateIds.has(template.id)}
                    onCheckedChange={() => toggleTemplate(template.id)}
                    className="h-3 w-3 rounded-sm border-slate-400 data-[state=checked]:bg-[#4c35c9] data-[state=checked]:border-[#4c35c9]"
                  />
                  <span className="text-[11px] text-slate-700 capitalize">{template.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <hr className="border-slate-200 mb-5" />

        {/* ── Portfolio / P3M Selection ── */}
        <div>
          <p className="text-xs font-medium text-slate-700 mb-3">
            Select Programs/Projects to be included in the report <span className="text-red-500">*</span>
          </p>

          {portfoliosLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400">Loading portfolios...</span>
            </div>
          ) : (
            <>
              {/* ── Grouped tree ── */}
              <div className="rounded border border-slate-200 overflow-hidden mb-4">

                {/* Summary bar */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-700">Projects Grouped By Program And Portfolio</span>
                    <span className="text-[11px] text-slate-500">
                      {counts.portfolios} Portfolio(S) / {counts.programs} Program(S) / {counts.projects} Project(S) Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAll}
                      className="text-[11px] text-[#4c35c9] hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <button className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-2 py-1 bg-white">
                      <SlidersHorizontal size={10} />
                      FILTERS
                      <span className="inline-flex items-center justify-center bg-[#4c35c9] text-white rounded-full w-3.5 h-3.5 text-[9px] font-bold ml-0.5">2</span>
                    </button>
                    <button
                      onClick={() => setExpandedPortfolios(new Set(portfolios.map(p => p.portfolio_id)))}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ChevronUp size={13} />
                    </button>
                  </div>
                </div>

                {/* Tree */}
                <div className="divide-y divide-slate-100">
                  {portfolios.map(portfolio => {
                    const isExpanded = expandedPortfolios.has(portfolio.portfolio_id)
                    const isChecked = selectedPortfolios.has(portfolio.portfolio_id)

                    return (
                      <div key={portfolio.portfolio_id}>

                        {/* Portfolio row — checkbox separate, rest of row toggles accordion */}
                        <div className={cn(
                          "flex items-center gap-2.5 px-4 py-2.5 transition-colors",
                          isChecked ? "bg-slate-50" : "hover:bg-slate-50/60"
                        )}>
                          <div onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handlePortfolioToggle(portfolio)}
                              className="h-3 w-3 rounded-sm border-slate-400 data-[state=checked]:bg-[#4c35c9] data-[state=checked]:border-[#4c35c9]"
                            />
                          </div>
                          <button
                            onClick={() => toggleExpand(portfolio.portfolio_id)}
                            className="flex items-center justify-between flex-1 text-left"
                          >
                            <span className="text-[11px] font-bold text-slate-800">
                              Portfolio: {portfolio.portfolio_name}
                            </span>
                            {isExpanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                          </button>
                        </div>

                        {/* Expanded: Programs + their Projects */}
                        {isExpanded && (
                          <div>
                            {(portfolio.programs || []).map(program => {
                              const programChecked = selectedPrograms.has(program.program_id)
                              return (
                                <div key={program.program_id}>
                                  {/* Program row */}
                                  <div className="flex items-center gap-2.5 pl-9 pr-4 py-2 hover:bg-slate-50/60 transition-colors">
                                    <Checkbox
                                      checked={programChecked}
                                      onCheckedChange={() => handleProgramToggle(program, portfolio)}
                                      className="h-3 w-3 rounded-sm border-slate-400 data-[state=checked]:bg-[#4c35c9] data-[state=checked]:border-[#4c35c9]"
                                    />
                                    <span className="text-[11px] font-semibold text-slate-700">
                                      Program: {program.program_name}
                                    </span>
                                  </div>

                                  {/* Projects */}
                                  {(program.projects || []).length > 0 && (
                                    <div className="pl-14 pr-4 flex flex-wrap gap-x-10 gap-y-0.5 pb-1.5">
                                      {(program.projects || []).map(project => (
                                        <label key={project.project_id} className="flex items-center gap-1.5 py-1 cursor-pointer min-w-[160px]">
                                          <Checkbox
                                            checked={selectedProjects.has(project.project_id)}
                                            onCheckedChange={() => handleProjectToggle(project.project_id, portfolio)}
                                            className="h-3 w-3 rounded-sm border-slate-400 data-[state=checked]:bg-[#4c35c9] data-[state=checked]:border-[#4c35c9]"
                                          />
                                          <span className="text-[11px] text-slate-600">{project.project_name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Standalone Projects (below the grouped tree) ── */}
              {allStandaloneProjects.length > 0 && (
                <div className="rounded border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-700">Projects Directly Linked to Portfolio</span>
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-x-10 gap-y-1">
                    {allStandaloneProjects.map(project => (
                      <label key={project.project_id} className="flex items-center gap-1.5 py-0.5 cursor-pointer min-w-[160px]">
                        <Checkbox
                          checked={selectedProjects.has(project.project_id)}
                          onCheckedChange={() => handleProjectToggle(project.project_id, project.portfolio)}
                          className="h-3 w-3 rounded-sm border-slate-400 data-[state=checked]:bg-[#4c35c9] data-[state=checked]:border-[#4c35c9]"
                        />
                        <span className="text-[11px] text-slate-600">{project.project_name}</span>
                        <span className="text-[10px] text-slate-400">({project.portfolio.portfolio_name})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}