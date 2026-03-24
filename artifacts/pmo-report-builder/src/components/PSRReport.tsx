import React from 'react';
import type { PSRReportData, ReportStatus } from '../types';

interface PSRReportProps {
  data: PSRReportData;
  isBlank?: boolean;
  updatedFields?: Set<string>;
}

const statusConfig: Record<ReportStatus, { bg: string; icon: string; label: string }> = {
  'on-track': { bg: '#8bc34a', icon: '✓', label: 'On Track' },
  'alert': { bg: '#ffb300', icon: '🔔', label: 'Alert' },
  'off-track': { bg: '#e65100', icon: '⚑', label: 'Off Track' },
  'completed': { bg: '#007bff', icon: '✓', label: 'Completed' },
  'not-tracked': { bg: '#9e9e9e', icon: '…', label: 'Not Tracked' },
};

const badgeColors: Record<string, string> = {
  HIGH: '#f44336',
  MEDIUM: '#ff9800',
  LOW: '#4caf50',
  EXTREME: '#c0392b',
  'Not Rated': '#9e9e9e',
};

function StatusIcon({ status }: { status: ReportStatus }) {
  const cfg = statusConfig[status] || statusConfig['not-tracked'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%',
      background: cfg.bg, color: '#fff', fontSize: 11, fontWeight: 700,
    }}>
      {cfg.icon}
    </span>
  );
}

function Badge({ level }: { level: string }) {
  const bg = badgeColors[level] || '#9e9e9e';
  return (
    <span style={{
      background: bg, color: '#fff', borderRadius: 3,
      padding: '2px 8px', fontSize: 11, fontWeight: 700,
      display: 'inline-block', minWidth: 64, textAlign: 'center',
    }}>
      {level}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ width: '100%', height: 14, background: '#ddd', border: '1px solid #bbb', borderRadius: 2 }}>
      <div style={{
        height: '100%', background: '#2a9fd6', width: `${pct}%`,
        borderRadius: 2, display: 'flex', alignItems: 'center', paddingLeft: 4,
        fontSize: 10, color: '#fff', fontWeight: 600,
      }}>
        {pct > 0 ? `${pct}%` : ''}
      </div>
    </div>
  );
}

export function PSRReport({ data, isBlank, updatedFields }: PSRReportProps) {
  const empty = (v: string) => isBlank && !v;
  const emptyStyle = (field: string): React.CSSProperties =>
    empty(field) ? { background: '#fffde7', color: '#bbb', fontStyle: 'italic' } : {};

  const isUpdated = (field: string) => updatedFields?.has(field);
  const updatedStyle = (field: string): React.CSSProperties =>
    isUpdated(field) ? { animation: 'highlight-fade 1.5s ease-out forwards', backgroundColor: 'hsl(199 79% 90%)' } : {};

  const cellStyle: React.CSSProperties = {
    border: '1px solid #d9d9d9', padding: '5px 7px', verticalAlign: 'middle', fontSize: 12,
  };
  const thStyle: React.CSSProperties = {
    border: '1px solid #cfcfcf', padding: '5px 7px', textAlign: 'left',
    background: '#e8e8e8', fontWeight: 700, fontSize: 12, color: '#0070c0',
  };
  const h3Style: React.CSSProperties = {
    margin: '14px 0 5px', fontSize: 13, fontWeight: 700, color: '#333',
    borderBottom: '1px solid #cfcfcf', paddingBottom: 3,
  };

  const indicators: Array<{ key: keyof typeof data.projectStatus; label: string }> = [
    { key: 'dependency', label: 'Dependency' },
    { key: 'issues', label: 'Issues' },
    { key: 'resource', label: 'Resource' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'risks', label: 'Risks' },
    { key: 'budget', label: 'Budget' },
    { key: 'scope', label: 'Scope' },
    { key: 'schedule', label: 'Schedule' },
  ];

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 12, color: '#333', background: '#fff', padding: '16px 20px 40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '4px solid #2a9fd6', paddingBottom: 16, marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#777' }}>Project Status Report</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a2456', marginTop: 2 }}>{data.projectName}</div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{ fontSize: 10, color: '#888' }}>Reporting Period</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2456', ...updatedStyle('reportingPeriod') }}>{data.reportingPeriod}</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Report Date</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2456', ...updatedStyle('reportDate') }}>
            {data.reportDate || (isBlank ? <span style={{ color: '#ccc' }}>DD/MM/YYYY</span> : '')}
          </div>
        </div>
      </div>

      {/* Info Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 12 }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700, whiteSpace: 'nowrap' }}>Overall Status</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}><StatusIcon status={data.overallStatus} /></td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Reporting Period</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.reportingPeriod}</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Baseline Start</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.baselineStart}</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Baseline End</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.baselineEnd}</td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Project Manager</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.projectManager}</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Project Director</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.projectDirector}</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Delivery Function</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.projectDeliveryFunction}</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0', color: '#2a9fd6', fontWeight: 700 }}>Program Manager</td>
            <td style={{ ...cellStyle, border: '1px solid #8ecde0' }}>{data.programManager || '—'}</td>
          </tr>
        </tbody>
      </table>

      <hr style={{ border: 'none', borderTop: '2px solid #2a9fd6', margin: '8px 0' }} />

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>

        {/* Left column */}
        <div>
          <h3 style={h3Style}>Project State</h3>
          <div style={{ padding: '4px 0', color: '#444' }}>{data.projectState}</div>

          <h3 style={h3Style}>Overall Status Summary</h3>
          <div style={{
            padding: '6px 8px', minHeight: 48, color: data.overallStatusSummary ? '#333' : '#bbb',
            fontStyle: data.overallStatusSummary ? 'normal' : 'italic',
            background: isUpdated('overallStatusSummary') ? 'hsl(199, 79%, 93%)' : (data.overallStatusSummary ? '#fafafa' : '#fffde7'),
            border: '1px solid #e8e8e8', borderRadius: 3, lineHeight: 1.5, fontSize: 12,
            transition: 'background 0.5s',
          }}>
            {data.overallStatusSummary || 'Not yet provided — tell Dotz what happened this quarter.'}
          </div>

          <h3 style={h3Style}>Project Status Indicators</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Indicator</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map(({ key, label }) => (
                <tr key={key} style={{ background: isUpdated(`status_${key}`) ? 'hsl(199, 79%, 93%)' : 'transparent', transition: 'background 0.5s' }}>
                  <td style={cellStyle}>{label}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}><StatusIcon status={data.projectStatus[key]} /></td>
                  <td style={{ ...cellStyle, color: data.projectStatusComments[key] ? '#333' : '#ccc', fontStyle: data.projectStatusComments[key] ? 'normal' : 'italic' }}>
                    {data.projectStatusComments[key] || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3Style}>Financial Snapshot (FY 2025–2026)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, fontSize: 11 }}>&nbsp;</th>
                <th style={{ ...thStyle, fontSize: 11 }}>FY Baseline</th>
                <th style={{ ...thStyle, fontSize: 11 }}>FY Forecast</th>
                <th style={{ ...thStyle, fontSize: 11 }}>Forecast Var.</th>
                <th style={{ ...thStyle, fontSize: 11 }}>YTD Baseline</th>
                <th style={{ ...thStyle, fontSize: 11 }}>YTD Actual</th>
                <th style={{ ...thStyle, fontSize: 11 }}>Actual Var.</th>
              </tr>
            </thead>
            <tbody>
              {(['capex', 'opex', 'total'] as const).map((row) => (
                <tr key={row} style={{ background: isUpdated(`financial_${row}`) ? 'hsl(199, 79%, 93%)' : (row === 'total' ? '#f0f0f0' : 'transparent'), transition: 'background 0.5s' }}>
                  <td style={{ ...cellStyle, fontWeight: 700, textTransform: 'uppercase' }}>{row}</td>
                  {(['baseline', 'forecast', 'forecastVariance', 'ytdBaseline', 'ytdActual', 'actualVariance'] as const).map((col) => (
                    <td key={col} style={{ ...cellStyle, color: (col === 'forecastVariance' || col === 'actualVariance') && data.financial[row][col]?.startsWith('-') ? '#c0392b' : (col === 'forecastVariance' || col === 'actualVariance') && data.financial[row][col]?.startsWith('+') ? '#27ae60' : '#444', fontStyle: !data.financial[row][col] ? 'italic' : 'normal', color2: !data.financial[row][col] ? '#ccc' : '' }}>
                      {data.financial[row][col] || (isBlank ? <span style={{ color: '#ccc' }}>—</span> : '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3Style}>Key Achievements &amp; Notable Events</h3>
          <div style={{
            padding: '6px 8px', minHeight: 48, lineHeight: 1.6,
            color: data.keyAchievements ? '#333' : '#bbb',
            fontStyle: data.keyAchievements ? 'normal' : 'italic',
            background: isUpdated('keyAchievements') ? 'hsl(199, 79%, 93%)' : (data.keyAchievements ? '#fafafa' : '#fffde7'),
            border: '1px solid #e8e8e8', borderRadius: 3, transition: 'background 0.5s',
          }}>
            {data.keyAchievements || 'Not yet provided.'}
          </div>

          <h3 style={h3Style}>Planned Activities – Next Reporting Period</h3>
          <div style={{
            padding: '6px 8px', minHeight: 40, lineHeight: 1.6,
            color: data.plannedActivities ? '#333' : '#bbb',
            fontStyle: data.plannedActivities ? 'normal' : 'italic',
            background: isUpdated('plannedActivities') ? 'hsl(199, 79%, 93%)' : (data.plannedActivities ? '#fafafa' : '#fffde7'),
            border: '1px solid #e8e8e8', borderRadius: 3, transition: 'background 0.5s',
          }}>
            {data.plannedActivities || 'Not yet provided.'}
          </div>
        </div>

        {/* Right column */}
        <div>
          <h3 style={h3Style}>Key Milestones</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Milestone</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Due Date</th>
                <th style={thStyle}>Current Due</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.milestones.map((m, i) => (
                <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={cellStyle}>{m.name}</td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{m.priority}</td>
                  <td style={cellStyle}>{m.dueDate}</td>
                  <td style={{ ...cellStyle, color: m.currentDueDate !== m.dueDate ? '#c0392b' : '#333', fontWeight: m.currentDueDate !== m.dueDate ? 700 : 400 }}>{m.currentDueDate}</td>
                  <td style={cellStyle}>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3Style}>End Products</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>End Date</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, width: 80 }}>% Complete</th>
              </tr>
            </thead>
            <tbody>
              {data.endProducts.map((p, i) => (
                <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={cellStyle}>{p.name}</td>
                  <td style={cellStyle}>{p.owner}</td>
                  <td style={cellStyle}>{p.endDate}</td>
                  <td style={cellStyle}>{p.status}</td>
                  <td style={cellStyle}><ProgressBar pct={p.completion} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3Style}>Risks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Risk Name</th>
                <th style={thStyle}>Actual Risk</th>
                <th style={thStyle}>Treatment</th>
                <th style={thStyle}>Residual Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.risks.map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={cellStyle}>{r.id}</td>
                  <td style={cellStyle}>{r.name}</td>
                  <td style={cellStyle}><Badge level={r.actualRisk} /></td>
                  <td style={{ ...cellStyle, color: r.treatment ? '#333' : '#ccc', fontStyle: r.treatment ? 'normal' : 'italic' }}>{r.treatment || '—'}</td>
                  <td style={cellStyle}><Badge level={r.residualRisk} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={h3Style}>Issues</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Criticality</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.issues.length > 0 ? data.issues.map((iss, i) => (
                <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                  <td style={cellStyle}>{iss.id}</td>
                  <td style={cellStyle}>{iss.description}</td>
                  <td style={cellStyle}>{iss.type}</td>
                  <td style={cellStyle}><Badge level={iss.criticality} /></td>
                  <td style={cellStyle}>{iss.status}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: '#bbb', fontStyle: 'italic' }}>No issues recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 8, borderTop: '3px solid #2a9fd6', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', flexWrap: 'wrap', gap: 8 }}>
        <div>Internal</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <StatusIcon status={key as ReportStatus} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>
        <div>Printed On: {new Date().toLocaleDateString('en-GB')}</div>
      </div>

      {/* Page 2 — Background */}
      {data.projectBackground && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '4px solid #2a9fd6' }}>
          <h3 style={h3Style}>Project Summary / Background</h3>
          <p style={{ fontSize: 11, lineHeight: 1.6, maxWidth: 700, margin: '4px 0', color: '#444' }}>{data.projectBackground}</p>
        </div>
      )}
    </div>
  );
}
