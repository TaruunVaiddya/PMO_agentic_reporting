import { ArrowRight, LucideIcon } from 'lucide-react';

export interface ReportCardData {
  id?: string;
  name: string;
  description: string;
  thumbnail: string;
  color?: string;
  createdAt?: string;
  status?: 'completed' | 'processing' | 'failed';
}

interface ReportCardProps {
  report: ReportCardData;
  onClick?: (report: ReportCardData) => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  return (
    <button
      onClick={() => onClick?.(report)}
      className="group relative border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 overflow-hidden bg-transparent w-full"
    >
      {/* Background gradient */}
      {report.color && (
        <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
      )}

      {/* Card structure */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Image thumbnail */}
        <div className="relative w-full h-32 overflow-hidden rounded-t-xl bg-black/10">
          <img
            src={report.thumbnail}
            alt={report.name}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
          />

          {/* Status badge */}
          {report.status && (
            <div className="absolute top-2 left-2 z-10">
              <span className={`text-xs px-2 py-1 rounded-full ${
                report.status === 'completed' ? 'bg-white/90 text-black' :
                report.status === 'processing' ? 'bg-white/20 text-white' :
                'bg-white/10 text-white/60'
              }`}>
                {report.status === 'completed' ? 'Ready' :
                 report.status === 'processing' ? 'Processing...' :
                 'Failed'}
              </span>
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 p-4 bg-black/10 group-hover:bg-black/20 transition-colors duration-200">
          {/* Report name */}
          <h3 className="text-sm font-medium text-white/90 mb-1 line-clamp-1">
            {report.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-white/50 line-clamp-2 leading-tight">
            {report.description}
          </p>

          {/* Created date */}
          {report.createdAt && (
            <p className="text-xs text-white/40 mt-2">
              {report.createdAt}
            </p>
          )}
        </div>
      </div>

      {/* Hover arrow */}
      <ArrowRight className="absolute top-3 right-3 w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-0.5 z-20" />
    </button>
  );
}
