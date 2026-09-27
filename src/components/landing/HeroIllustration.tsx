export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 lg:mt-20" aria-hidden="true">
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-[#f5f5f7] via-white to-[#eef2f7] border border-[#e5e5ea] overflow-hidden relative">
        {/* Video frame simulation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        </div>

        {/* Simulated bounding boxes */}
        <div className="absolute top-1/4 left-1/4 w-24 h-20 rounded-lg border-2 border-[#0066FF]/80 bg-[#0066FF]/10 animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="absolute top-1/3 right-1/3 w-20 h-28 rounded-lg border-2 border-[#30D158]/80 bg-[#30D158]/10 animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="absolute bottom-1/4 left-1/3 w-28 h-16 rounded-lg border-2 border-[#FF9F0A]/80 bg-[#FF9F0A]/10 animate-pulse" style={{ animationDelay: '600ms' }} />
        <div className="absolute bottom-1/3 right-1/4 w-18 h-22 rounded-lg border-2 border-[#BF5AF2]/80 bg-[#BF5AF2]/10 animate-pulse" style={{ animationDelay: '900ms' }} />

        {/* Center play indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Timeline indicator at bottom */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full" style={{ width: '65%' }} />
          </div>
          <span className="text-white/70 text-[11px] font-mono tabular-nums w-16">0:42 / 1:05</span>
        </div>
      </div>

      {/* Floating metric cards */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 px-4">
        <div className="bg-white border border-[#e5e5ea] rounded-xl px-4 py-3 shadow-lg shadow-black/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-[#8a8a8f] font-medium uppercase tracking-wide">Cycle Time</p>
            <p className="text-[16px] font-semibold text-[#1d1d1f]">65.2s</p>
          </div>
        </div>
        <div className="bg-white border border-[#e5e5ea] rounded-xl px-4 py-3 shadow-lg shadow-black/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#30D158]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M12 6v12M6 12h12" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-[#8a8a8f] font-medium uppercase tracking-wide">Efficiency</p>
            <p className="text-[16px] font-semibold text-[#1d1d1f]">84%</p>
          </div>
        </div>
        <div className="bg-white border border-[#e5e5ea] rounded-xl px-4 py-3 shadow-lg shadow-black/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF9F0A]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2">
              <path d="M12 6v12M6 12h12" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-[#8a8a8f] font-medium uppercase tracking-wide">Actions</p>
            <p className="text-[16px] font-semibold text-[#1d1d1f]">12</p>
          </div>
        </div>
      </div>
    </div>
  );
}