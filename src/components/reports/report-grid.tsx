import { ReportCard, ReportCardData } from './report-card';

interface ReportGridProps {
  reports: ReportCardData[];
  onReportClick?: (report: ReportCardData) => void;
  onUseTemplate?: (report: ReportCardData) => void;
  onDelete?: (report: ReportCardData) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function ReportGrid({ reports, onReportClick, onUseTemplate, onDelete, columns = 6 }: ReportGridProps) {
  const gridClass = columns === 2 ? 'grid-cols-2' :
    columns === 3 ? 'grid-cols-2 md:grid-cols-3' :
      columns === 4 ? 'grid-cols-2 md:grid-cols-4' :
        columns === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

  return (
    <div className={`grid ${gridClass} gap-5`}>
      {reports.map((report, index) => (
        <ReportCard
          key={report.id || index}
          report={report}
          onClick={onReportClick}
          onUseTemplate={onUseTemplate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
