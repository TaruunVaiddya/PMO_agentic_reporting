"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Briefcase, FolderOpen, FileText } from 'lucide-react'
import { fetcher } from '@/lib/get-fetcher'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

// ── Types ────────────────────────────────────────────────────────────

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

export interface SelectedP3MData {
    portfolios: number[]
    programs: number[]
    projects: number[]
}

interface PortfolioSelectorProps {
    onContinue: (selected: SelectedP3MData) => void
    onBack: () => void
    templateName?: string
}

// ── Component ────────────────────────────────────────────────────────

export function PortfolioSelector({ onContinue, onBack, templateName }: PortfolioSelectorProps) {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Selection state — flat sets for O(1) lookups
    const [selectedPortfolios, setSelectedPortfolios] = useState<Set<number>>(new Set())
    const [selectedPrograms, setSelectedPrograms] = useState<Set<number>>(new Set())
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set())

    // Track which portfolio the user is currently working within (one at a time)
    const [activePortfolioId, setActivePortfolioId] = useState<number | null>(null)

    // Collapsible state
    const [expandedPortfolios, setExpandedPortfolios] = useState<Set<number>>(new Set())

    // ── Fetch data ──────────────────────────────────────────────────

    useEffect(() => {
        const getData = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await fetcher('/p3m-reporting-data')
                setPortfolios(data)
                // Auto-expand all portfolios on load
                const allIds = new Set<number>(data.map((p: Portfolio) => p.portfolio_id))
                setExpandedPortfolios(allIds)
            } catch (err) {
                console.error("Failed to load P3M data", err)
                setError("Failed to load portfolio data. Please try again.")
            } finally {
                setLoading(false)
            }
        }
        getData()
    }, [])

    // ── Helpers — collect all descendant IDs ────────────────────────

    const getAllProjectIdsInProgram = useCallback((program: Program): number[] => {
        return (program.projects || []).map(p => p.project_id)
    }, [])

    const getAllProgramIdsInPortfolio = useCallback((portfolio: Portfolio): number[] => {
        return (portfolio.programs || []).map(p => p.program_id)
    }, [])

    const getAllProjectIdsInPortfolio = useCallback((portfolio: Portfolio): number[] => {
        const fromPrograms = (portfolio.programs || []).flatMap(pg => (pg.projects || []).map(p => p.project_id))
        const standalone = (portfolio.standalone_projects || []).map(p => p.project_id)
        return [...fromPrograms, ...standalone]
    }, [])

    // ── Toggle expand/collapse ──────────────────────────────────────

    const toggleExpand = useCallback((portfolioId: number) => {
        setExpandedPortfolios(prev => {
            const next = new Set(prev)
            if (next.has(portfolioId)) next.delete(portfolioId)
            else next.add(portfolioId)
            return next
        })
    }, [])

    // ── Helper: clear all selections and switch active portfolio ────

    const switchToPortfolio = useCallback((portfolioId: number) => {
        setSelectedPortfolios(new Set())
        setSelectedPrograms(new Set())
        setSelectedProjects(new Set())
        setActivePortfolioId(portfolioId)
    }, [])

    // ── Selection handlers (cascading ONLY top → down) ──────────────

    const handlePortfolioToggle = useCallback((portfolio: Portfolio) => {
        const isSelected = selectedPortfolios.has(portfolio.portfolio_id)

        if (isSelected) {
            // Deselect this portfolio and all its children
            setSelectedPortfolios(new Set())
            setSelectedPrograms(new Set())
            setSelectedProjects(new Set())
            setActivePortfolioId(null)
        } else {
            // Clear previous selection, then select this portfolio and all its children
            const programIds = getAllProgramIdsInPortfolio(portfolio)
            const projectIds = getAllProjectIdsInPortfolio(portfolio)

            setActivePortfolioId(portfolio.portfolio_id)
            setSelectedPortfolios(new Set([portfolio.portfolio_id]))
            setSelectedPrograms(new Set(programIds))
            setSelectedProjects(new Set(projectIds))
        }
    }, [selectedPortfolios, getAllProgramIdsInPortfolio, getAllProjectIdsInPortfolio])

    const handleProgramToggle = useCallback((program: Program, portfolio: Portfolio) => {
        // If clicking in a different portfolio, switch to it first
        if (activePortfolioId !== null && activePortfolioId !== portfolio.portfolio_id) {
            switchToPortfolio(portfolio.portfolio_id)
            // Select this program and its projects in the new portfolio
            setSelectedPrograms(new Set([program.program_id]))
            setSelectedProjects(new Set(getAllProjectIdsInProgram(program)))
            return
        }

        // Set active portfolio if none yet (but don't check its checkbox)
        if (activePortfolioId === null) {
            setActivePortfolioId(portfolio.portfolio_id)
        }

        const isSelected = selectedPrograms.has(program.program_id)

        setSelectedPrograms(prev => {
            const next = new Set(prev)
            if (isSelected) next.delete(program.program_id)
            else next.add(program.program_id)
            return next
        })

        // Cascade to all projects in this program (top-down only)
        const projectIds = getAllProjectIdsInProgram(program)
        setSelectedProjects(prev => {
            const next = new Set(prev)
            projectIds.forEach(id => isSelected ? next.delete(id) : next.add(id))
            return next
        })
    }, [activePortfolioId, selectedPrograms, getAllProjectIdsInProgram, switchToPortfolio])

    const handleProjectToggle = useCallback((projectId: number, program: Program | null, portfolio: Portfolio) => {
        // If clicking in a different portfolio, switch to it first
        if (activePortfolioId !== null && activePortfolioId !== portfolio.portfolio_id) {
            switchToPortfolio(portfolio.portfolio_id)
            // Select just this project in the new portfolio
            setSelectedProjects(new Set([projectId]))
            return
        }

        // Set active portfolio if none yet (but don't check its checkbox)
        if (activePortfolioId === null) {
            setActivePortfolioId(portfolio.portfolio_id)
        }

        const isSelected = selectedProjects.has(projectId)

        setSelectedProjects(prev => {
            const next = new Set(prev)
            if (isSelected) next.delete(projectId)
            else next.add(projectId)
            return next
        })
        // No bottom-up: parent program/portfolio checkboxes are NOT affected
    }, [activePortfolioId, selectedProjects, switchToPortfolio])

    // ── Check state helpers (no indeterminate — just checked/unchecked) ──

    const getPortfolioCheckState = useCallback((portfolio: Portfolio): boolean => {
        return selectedPortfolios.has(portfolio.portfolio_id)
    }, [selectedPortfolios])

    const getProgramCheckState = useCallback((program: Program): boolean => {
        return selectedPrograms.has(program.program_id)
    }, [selectedPrograms])

    // ── Counts ──────────────────────────────────────────────────────

    const counts = useMemo(() => ({
        portfolios: selectedPortfolios.size,
        programs: selectedPrograms.size,
        projects: selectedProjects.size,
    }), [selectedPortfolios, selectedPrograms, selectedProjects])

    const hasSelection = counts.portfolios > 0 || counts.programs > 0 || counts.projects > 0

    // ── Loading / Error states ──────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-6 w-6 animate-spin text-[#1a2456] opacity-40" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-red-500 text-sm">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div className="w-[70%] mx-auto px-6 py-10 h-full ">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4"
                >
                    <ArrowLeft size={14} />
                    <span>Back to templates</span>
                </button>
                <h2 className="text-2xl font-bold text-[#1a2456] tracking-tight">
                    Select Programs / Projects
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                    Choose the portfolios, programs, and projects to include in the report
                    {templateName && (
                        <span className="text-[#1a2456] font-medium"> — {templateName}</span>
                    )}
                </p>
            </div>

            {/* Main selection area */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Summary bar */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Briefcase size={15} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">
                            Projects Grouped By Program And Portfolio
                        </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                        {counts.portfolios} Portfolio(s) / {counts.programs} Program(s) / {counts.projects} Project(s) Selected
                    </span>
                </div>

                {/* Portfolio list */}
                <div className="divide-y divide-slate-100">
                    {portfolios.map(portfolio => {
                        const isExpanded = expandedPortfolios.has(portfolio.portfolio_id)
                        const checkState = getPortfolioCheckState(portfolio)

                        return (
                            <div key={portfolio.portfolio_id}>
                                {/* Portfolio row */}
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-3.5 transition-colors",
                                        checkState === true ? "bg-[#1a2456]/[0.03]" : "hover:bg-slate-50"
                                    )}
                                >
                                    <button
                                        onClick={() => toggleExpand(portfolio.portfolio_id)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                                    >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                    <Checkbox
                                        checked={checkState}
                                        onCheckedChange={() => handlePortfolioToggle(portfolio)}
                                    />
                                    <Briefcase size={15} className="text-amber-500 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-[#1a2456]">
                                        Portfolio: {portfolio.portfolio_name}
                                    </span>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="pl-10 pb-2">
                                        {/* Programs */}
                                        {(portfolio.programs || []).map(program => {
                                            const programCheckState = getProgramCheckState(program)

                                            return (
                                                <div key={program.program_id} className="mb-1">
                                                    {/* Program row */}
                                                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                                        <Checkbox
                                                            checked={programCheckState}
                                                            onCheckedChange={() => handleProgramToggle(program, portfolio)}
                                                        />
                                                        <FolderOpen size={14} className="text-blue-500 flex-shrink-0" />
                                                        <span className="text-sm font-medium text-slate-700">
                                                            Program: {program.program_name}
                                                        </span>
                                                    </div>

                                                    {/* Projects under program */}
                                                    {(program.projects || []).length > 0 && (
                                                        <div className="pl-10 flex flex-wrap gap-x-6 gap-y-1 py-1">
                                                            {(program.projects || []).map(project => (
                                                                <label
                                                                    key={project.project_id}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer min-w-[200px]"
                                                                >
                                                                    <Checkbox
                                                                        checked={selectedProjects.has(project.project_id)}
                                                                        onCheckedChange={() => handleProjectToggle(project.project_id, program, portfolio)}
                                                                    />
                                                                    <FileText size={13} className="text-slate-400 flex-shrink-0" />
                                                                    <span className="text-sm text-slate-600">{project.project_name}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}

                                        {/* Standalone projects */}
                                        {portfolio.standalone_projects && portfolio.standalone_projects.length > 0 && (
                                            <div className="mt-2 mb-2">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-1.5">
                                                    Projects Directly Linked to Portfolio
                                                </p>
                                                <div className="pl-4 flex flex-wrap gap-x-6 gap-y-1 py-1">
                                                    {portfolio.standalone_projects.map(project => (
                                                        <label
                                                            key={project.project_id}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer min-w-[200px]"
                                                        >
                                                            <Checkbox
                                                                checked={selectedProjects.has(project.project_id)}
                                                                onCheckedChange={() => handleProjectToggle(project.project_id, null, portfolio)}
                                                            />
                                                            <FileText size={13} className="text-slate-400 flex-shrink-0" />
                                                            <span className="text-sm text-slate-600">{project.project_name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Floating continue button */}
            <div className={cn(
                "fixed bottom-10 left-1/2 -translate-x-1/2 transition-all duration-500 transform z-50",
                hasSelection ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
            )}>
                <Button
                    onClick={() => onContinue({
                        portfolios: Array.from(selectedPortfolios),
                        programs: Array.from(selectedPrograms),
                        projects: Array.from(selectedProjects),
                    })}
                    className="bg-[#1a2456] hover:bg-[#25337a] text-white px-10 py-7 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
                >
                    <div className="text-left">
                        <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Continue with</p>
                        <p className="text-sm font-bold">
                            {counts.projects} Project{counts.projects !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                    <div className="h-8 w-[1px] bg-white/20 mx-1" />
                    <ArrowRight size={20} />
                </Button>
            </div>

            {/* Bottom padding for floating button */}
            <div className="h-32" />
        </div>
    )
}
