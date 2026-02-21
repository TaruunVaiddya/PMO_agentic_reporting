import { ReportCard, ReportCardData } from './report-card';

interface ReportGridProps {
  reports: ReportCardData[];
  onReportClick?: (report: ReportCardData) => void;
  onDelete?: (report: ReportCardData) => void;
  columns?: 2 | 3 | 4;
}

export function ReportGrid({ reports, onReportClick, onDelete, columns = 4 }: ReportGridProps) {
  const gridClass = columns === 2 ? 'grid-cols-2' :
                    columns === 3 ? 'grid-cols-2 md:grid-cols-3' :
                    'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {reports.map((report, index) => (
        <ReportCard
          key={report.id || index}
          report={report}
          onClick={onReportClick}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
