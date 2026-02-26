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
      className="group relative border border-white/10 hover:border-white/30 rounded-xl transition-all duration-300 overflow-hidden bg-black/40 w-full cursor-pointer hover:shadow-2xl hover:shadow-white/5"
      onClick={() => onClick?.(report)}
    >
      {/* Background gradient */}
      {report.color && (
        <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      )}

      {/* Card structure */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Image thumbnail — slightly shorter with aspect-[4/5] */}
        <div className="relative w-full xl:aspect-[4/5] aspect-square overflow-hidden bg-black/20 p-2">
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/5 bg-black/40">
            <img
              src={report.thumbnail}
              alt={report.name}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 will-change-transform"
            />
          </div>

          {/* Status badge */}
          {report.status && (
            <div className="absolute top-4 left-4 z-10">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${report.status === 'completed' ? 'bg-white/90 text-black shadow-lg shadow-white/20' :
                report.status === 'processing' ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' :
                  'bg-red-500/20 text-red-200 border border-red-500/30'
                }`}>
                {report.status === 'completed' ? 'Ready' :
                  report.status === 'processing' ? 'Processing' :
                    'Failed'}
              </span>
            </div>
          )}

          {/* "Use Template" pill button — appears on hover at bottom center/right */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseTemplate?.(report);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold shadow-xl 
                         opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                         hover:bg-gray-100 hover:scale-105 active:scale-95
                         transition-all duration-300 ease-out"
            >
              <Sparkles className="w-3 h-3" />
              <span>Use</span>
            </button>
          </div>

          {/* Hover overlay gradient for better text/button contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none rounded-t-xl" />
        </div>

        {/* Name only */}
        <div className="p-3 bg-gradient-to-b from-transparent to-black/40 flex-1 flex items-center justify-center">
          <h3 className="text-sm font-medium text-white/90 line-clamp-2 text-center group-hover:text-white transition-colors">
            {report.name}
          </h3>
        </div>
      </div>

      {/* Delete button — only shown when onDelete is provided */}
      {onDelete && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(report);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onDelete(report);
            }
          }}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white/50 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white hover:border-red-500/50 transition-all duration-200 cursor-pointer shadow-lg"
          title="Delete template"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
