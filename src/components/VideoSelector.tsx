import React, { useState } from 'react';
import { Upload, CheckCircle2, Film, RefreshCw } from 'lucide-react';
import { BENCHMARK_PRESETS } from '../data/benchmarks';
import type { BenchmarkPreset } from '../types';

interface VideoSelectorProps {
  currentPreset: BenchmarkPreset;
  onSelectPreset: (preset: BenchmarkPreset) => void;
  onUploadCustomVideo: (file: File) => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
}

export const VideoSelector: React.FC<VideoSelectorProps> = ({
  currentPreset,
  onSelectPreset,
  onUploadCustomVideo,
  isAnalyzing,
  analysisProgress,
  analysisStage
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onUploadCustomVideo(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCustomVideo(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
      
      {/* Top Title & Custom Upload Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            Physical Task Video Input
          </h3>
          <p className="text-xs text-slate-400">
            Upload a short 30–90s handheld phone video or choose an industrial benchmark below.
          </p>
        </div>

        {/* Upload Custom File Button / Drag Target */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
            dragActive
              ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 scale-105'
              : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 text-indigo-200'
          }`}
        >
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>Upload Custom Video (MP4/MOV)</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Benchmark Task Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {BENCHMARK_PRESETS.map((preset) => {
          const isSelected = currentPreset.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all group ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                  : 'border-white/10 hover:border-white/20 bg-slate-900/60'
              }`}
            >
              {/* Thumbnail Image */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={preset.poster}
                  alt={preset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Active Indicator Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="bg-slate-900/90 px-2 py-0.5 rounded font-mono">
                    ⏱ {preset.duration_sec}s
                  </span>
                  <span className="bg-indigo-600/80 text-white px-2 py-0.5 rounded font-semibold">
                    {preset.industry.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="p-3 space-y-1">
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {preset.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis Progress Loading State */}
      {isAnalyzing && (
        <div className="bg-indigo-950/80 border border-indigo-500/30 p-4 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>{analysisStage || 'Analyzing physical task video...'}</span>
            </div>
            <span className="font-mono text-indigo-400 font-bold">{analysisProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${analysisProgress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
            />
          </div>
        </div>
      )}

    </div>
  );
};
