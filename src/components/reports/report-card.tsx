import { Trash2, Sparkles } from 'lucide-react';

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
  onClick?: (report: ReportCardData) => void; // Now acts as preview trigger
  onUseTemplate?: (report: ReportCardData) => void;
  onDelete?: (report: ReportCardData) => void;
}

export function ReportCard({ report, onClick, onUseTemplate, onDelete }: ReportCardProps) {
  return (
    <div
      className="group relative border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-300 overflow-hidden bg-white w-full cursor-pointer hover:shadow-xl"
      onClick={() => onClick?.(report)}
    >
      {/* Background gradient overlay on hover */}
      {report.color && (
        <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
      )}

      {/* Card structure */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Image thumbnail */}
        <div className="relative w-full aspect-[3/2] overflow-hidden bg-slate-50 p-2">
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-100 bg-white">
            <img
              src={report.thumbnail}
              alt={report.name}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 will-change-transform"
            />
          </div>

          {/* Status badge */}
          {report.status && (
            <div className="absolute top-4 left-4 z-10">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${report.status === 'completed' ? 'bg-[#1a2456] text-white' :
                report.status === 'processing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  'bg-red-100 text-red-700 border border-red-200'
                }`}>
                {report.status === 'completed' ? 'Ready' :
                  report.status === 'processing' ? 'Processing' :
                    'Failed'}
              </span>
            </div>
          )}

          {/* "Use Template" button */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseTemplate?.(report);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a2456] text-white text-xs font-semibold shadow-lg 
                         opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                         hover:bg-[#25337a] hover:scale-105 active:scale-95
                         transition-all duration-300 ease-out"
            >
              <Sparkles className="w-3 h-3" />
              <span>Use</span>
            </button>
          </div>

          {/* Hover overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none rounded-t-xl" />
        </div>

        {/* Name section */}
        <div className="p-3 bg-white flex-1 flex items-center justify-center border-t border-slate-50">
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 text-center group-hover:text-[#1a2456] transition-colors">
            {report.name}
          </h3>
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(report);
          }}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-md bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 cursor-pointer shadow-sm"
          title="Delete template"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
