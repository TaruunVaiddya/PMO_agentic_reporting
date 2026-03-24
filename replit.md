# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies. This is the PMO Agentic Reporting platform (StrategyDotZero).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── pmo-report-builder/ # PMO Report Builder React app (previewPath: /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── public/                 # Static assets
│   └── email-notification.html  # Outlook-friendly PM notification email
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## PMO Report Builder App (`artifacts/pmo-report-builder`)

A React + Vite web application implementing the agent-assisted project status reporting flow.

### Key Features
1. **Notification Email** (`public/email-notification.html`) — Outlook-friendly HTML email with warm encouraging language and CTA button. Replace `REPORT_BUILDER_URL_HERE` with the deployed app URL before sending.

2. **Report Builder App** (previewPath: `/`) — Full split-panel experience:
   - **Left panel**: Dotz AI chat agent that guides PMs through filling in their PSR
   - **Right panel**: Tabbed view with current blank Q1 2026 report + 3 past report intervals for reference
   
### App Flow
1. Dotz welcomes the PM with reporting context
2. If multiple projects, asks PM to select which project
3. Asks PM for a "memory dump" — free-form update of what happened in the quarter
4. Simulates AI processing (2.8s animation) → populates key report sections
5. Asks follow-up questions one by one with suggested options (from past reports)
6. Once complete, PM can preview the full report, submit to PMO, or download as PDF/Word/PPTX

### Key Files
- `src/App.tsx` — Main split-panel layout with project state management
- `src/components/ChatPanel.tsx` — Dotz AI chat interface and conversation flow
- `src/components/ReportPanel.tsx` — Tabbed report panel with submit/download bar
- `src/components/PSRReport.tsx` — PSR report template rendered as React component
- `src/data/mockData.ts` — Mock projects and past 3 report intervals data
- `src/types/index.ts` — TypeScript types

### Mock Data
- 2 projects: "New Global Initiative" and "Enterprise Security Services (ESS)"
- Past reports cover: Oct–Dec 2025, Jul–Sep 2025, Apr–Jun 2025

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation.

- Entry: `src/index.ts`
- App setup: `src/app.ts`
- Routes: `src/routes/index.ts`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
