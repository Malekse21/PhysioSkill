import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { AnalysisResult, AtomicAction, HumanInsightStep } from '../types';

interface VideoCanvasPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  analysisData?: AnalysisResult;
  selectedTime?: number;
  onTimeUpdate?: (time: number) => void;
}

const actionLabel = {
  pick: 'Pick up', place: 'Set down', release: 'Release', move: 'Move', hold: 'Hold',
  wait: 'Wait', align: 'Line up', inspect: 'Check', press: 'Press',
};

export const VideoCanvasPlayer: React.FC<VideoCanvasPlayerProps> = ({
  videoUrl,
  posterUrl,
  analysisData,
  selectedTime,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(analysisData?.human_insights.total_duration_seconds || 45);
  const [showBoxes, setShowBoxes] = useState(true);
  const [mediaUnavailable, setMediaUnavailable] = useState(false);
  const [activeAction, setActiveAction] = useState<AtomicAction | null>(null);
  const [activeStep, setActiveStep] = useState<HumanInsightStep | null>(null);

  useEffect(() => {
    setMediaUnavailable(false);
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveAction(null);
    setActiveStep(null);
  }, [videoUrl]);

  useEffect(() => {
    if (selectedTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = selectedTime;
      setCurrentTime(selectedTime);
    }
  }, [selectedTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play().catch(console.error);
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    if (onTimeUpdate) onTimeUpdate(t);

    setActiveStep(analysisData?.human_insights.steps.find(s => t >= s.start_time && t <= s.end_time) ?? null);
    const action = analysisData?.robot_data.atomic_actions.find(a => t >= a.start_sec && t <= a.end_sec) ?? null;
    setActiveAction(action);
    drawOverlay(action);
  };

  const drawOverlay = (action: AtomicAction | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showBoxes || !action?.bounding_box_normalized) return;

    const [ymin, xmin, ymax, xmax] = action.bounding_box_normalized;
    const x = (xmin / 1000) * canvas.width;
    const y = (ymin / 1000) * canvas.height;
    const w = ((xmax - xmin) / 1000) * canvas.width;
    const h = ((ymax - ymin) / 1000) * canvas.height;

    // Colour map
    const colours: Record<string, string> = {
      pick: '#111111', place: '#444448', release: '#444448',
      move: '#66666b', hold: '#88888d', wait: '#88888d',
      align: '#333337', inspect: '#333337', press: '#000000',
    };

    // Action label map
    const actionLabel: Record<string, string> = {
      pick: 'Pick', place: 'Place', release: 'Release',
      move: 'Move', hold: 'Hold', wait: 'Wait',
      align: 'Align', inspect: 'Inspect', press: 'Press',
    };
    const c = colours[action.primitive] ?? '#111111';

    const scale = Math.max(1, canvas.width / 900);
    const line = 2.5 * scale;
    const radius = 8 * scale;
    ctx.lineWidth = line;
    ctx.strokeStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = 12 * scale;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = `${c}18`;
    ctx.fill();

    // Bright corner marks keep the detection visible over busy footage.
    const corner = Math.min(22 * scale, Math.min(w, h) * 0.22);
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
    ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner);
    ctx.moveTo(x, y + h - corner); ctx.lineTo(x, y + h); ctx.lineTo(x + corner, y + h);
    ctx.moveTo(x + w - corner, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - corner);
    ctx.strokeStyle = c;
    ctx.stroke();

    // Label
    const label = `${actionLabel[action.primitive] ?? action.primitive} · ${action.target_object}`;
    ctx.font = `600 ${12 * scale}px -apple-system, Inter, sans-serif`;
    const tw = ctx.measureText(label).width;
    const labelY = Math.max(0, y - 28 * scale);
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 8 * scale;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x, labelY, tw + 18 * scale, 24 * scale, 6 * scale);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 9 * scale, labelY + 16 * scale);
  };

  useEffect(() => { drawOverlay(activeAction); }, [activeAction, showBoxes]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || analysisData?.human_insights.total_duration_seconds || 45);
    if (canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 360;
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-[#d2d2d7] rounded-2xl overflow-hidden bg-white">

      {/* Video */}
      <div className="relative aspect-video bg-black group">
        {!mediaUnavailable ? <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={() => { setMediaUnavailable(true); setIsPlaying(false); }}
          className="w-full h-full object-contain"
          playsInline
          muted
        /> : <div className="absolute inset-0 flex items-center justify-center bg-[#11151d]">
          {posterUrl && <img src={posterUrl} alt="Sample video poster" className="absolute inset-0 h-full w-full object-cover opacity-65" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/35" />
          <div className="relative max-w-xs px-5 text-center text-white">
            <p className="text-sm font-semibold">{posterUrl ? 'Sample preview image' : 'Video could not be opened'}</p>
            <p className="mt-1 text-xs text-white/75">{posterUrl ? 'Upload your own video to analyze real frames.' : 'Try another MP4, MOV, or WebM file.'}</p>
          </div>
        </div>}
        {!mediaUnavailable && <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-2.5 py-1.5 text-[10px] font-medium text-white shadow-lg backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          {activeAction ? `${actionLabel[activeAction.primitive] ?? activeAction.primitive} · ${activeAction.target_object}` : 'Video preview'}
        </div>
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-all hover:bg-black/20"
          >
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 fill-[#1d1d1f] text-[#1d1d1f] ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Segmented timeline */}
      <div className="px-4 pt-3">
        <div className="relative h-2.5 bg-[#e8e8ed] rounded-full overflow-hidden shadow-inner">
          {(analysisData?.human_insights.steps || []).map(step => {
            const left = (step.start_time / duration) * 100;
            const width = ((step.end_time - step.start_time) / duration) * 100;
            const isNVA = step.category === 'non_value_added' || step.category === 'idle';
            return (
              <div
                key={step.step_number}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={step.name}
                className={`absolute top-0 bottom-0 step-segment opacity-75 transition-opacity ${isNVA ? 'bg-[#a1a1a6]' : 'bg-black'}`}
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = step.start_time; }}
              />
            );
          })}
          {/* Scrub overlay */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setCurrentTime(v);
              if (videoRef.current) videoRef.current.currentTime = v;
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-[#1d1d1f] shadow-[0_0_4px_white]" style={{ left: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3.5 flex items-center justify-between bg-gradient-to-b from-white to-[#fafafa]">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-[#1d1d1f] flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            {isPlaying
              ? <Pause className="w-3.5 h-3.5 fill-white text-white" />
              : <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />}
          </button>
          <button
            onClick={() => { if (videoRef.current) { videoRef.current.currentTime = 0; setCurrentTime(0); } }}
            className="text-[#aeaeb2] hover:text-[#6e6e73] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[12px] text-[#6e6e73]">{fmt(currentTime)} / {fmt(duration)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active step name */}
          {activeStep && (
            <span className="text-[11px] text-[#6e6e73] max-w-36 truncate">{activeStep.name}</span>
          )}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
              showBoxes
                ? 'border-black text-black bg-[#f5f5f7]'
                : 'border-[#d2d2d7] text-[#aeaeb2]'
            }`}
          >
            Boxes
          </button>
        </div>
      </div>

    </div>
  );
};
