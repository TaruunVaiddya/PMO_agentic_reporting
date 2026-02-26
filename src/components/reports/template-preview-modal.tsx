import { Sparkles, Loader2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { ReportCardData } from '@/components/reports/report-card';

interface TemplatePreviewModalProps {
    template: ReportCardData | null;
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (template: ReportCardData) => void;
}

export function TemplatePreviewModal({
    template,
    isOpen,
    onClose,
    onUseTemplate,
}: TemplatePreviewModalProps) {
    const [isStarting, setIsStarting] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const panOffset = useRef({ x: 0, y: 0 });

    if (!template) return null;

    const handleUse = async () => {
        setIsStarting(true);
        try {
            await onUseTemplate(template);
            onClose();
        } finally {
            setIsStarting(false);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(Math.max(0.5, prev + delta), 4));
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({
            x: e.clientX - panStart.current.x,
            y: e.clientY - panStart.current.y,
        });
    };

    const handleMouseUp = () => setIsPanning(false);

    const zoomPercent = Math.round(zoom * 100);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-none w-[95vw] sm:w-[85vw] md:w-[80vw] lg:w-[70vw] xl:w-[65vw] h-[90vh] sm:h-[80vh] p-0 overflow-hidden border border-white/30 shadow-2xl bg-gradient-to-br from-black/95 to-neutral-950/95 backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row [&>button:last-child]:hidden">
                {/* Left Side: Zoomable Preview */}
                <div
                    className="flex-1 relative min-h-[40vh] sm:min-h-0 border-b sm:border-b-0 sm:border-r border-white/20 bg-black/40 overflow-hidden select-none"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                >
                    <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        }}
                    >
                        <img
                            src={template.thumbnail}
                            alt={`${template.name} preview`}
                            className="max-w-full max-h-full object-contain pointer-events-none"
                            draggable={false}
                        />
                    </div>

                    {/* Subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/5 pointer-events-none" />

                    {/* Zoom Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-black/70 border border-white/15 backdrop-blur-sm">
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-white/50 font-mono w-10 text-center tabular-nums">
                            {zoomPercent}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        {zoom !== 1 && (
                            <button
                                onClick={handleReset}
                                className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors ml-0.5 border-l border-white/10 pl-1.5"
                                title="Reset zoom"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side: Details & Actions */}
                <div className="w-full sm:w-[280px] lg:w-[320px] flex flex-col relative z-20">
                    <div className="p-6 sm:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                        <DialogHeader className="mb-8 text-left relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 uppercase tracking-[0.2em]">
                                    Template
                                </span>
                                <DialogClose className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-200">
                                    <X className="w-4 h-4" />
                                </DialogClose>
                            </div>
                            <DialogTitle className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                                {template.name}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Description</h4>
                                <p className="text-sm text-white leading-relaxed font-light">
                                    {template.description || "A professional report template designed for clarity and impact."}
                                </p>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/10">
                                {template.createdAt && (
                                    <div className="space-y-1.5">
                                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Release Date</h4>
                                        <p className="text-sm text-white/95 font-medium">
                                            {new Date(template.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {template.status && (
                                    <div className="space-y-1.5">
                                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Status</h4>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-sm ${template.status === 'completed' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/30'}`} />
                                            <span className="text-sm text-white/95 capitalize font-medium">{template.status}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 border-t border-white/20 bg-black/40 backdrop-blur-md">
                        <div className="relative group">
                            <button
                                onClick={handleUse}
                                disabled={isStarting}
                                className="w-full relative px-6 py-4 text-sm bg-black/20 hover:bg-black/10 disabled:bg-black/40 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg"
                            >
                                <div
                                    className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 80%)"
                                    }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isStarting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                                            <span className="tracking-widest">STARTING...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 text-white/80" />
                                            <span className="tracking-[0.15em]">USE TEMPLATE</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
