import React from 'react';
import { Activity, Cpu, Cloud, FileText } from 'lucide-react';

interface NavbarProps {
  activeTab: 'insights' | 'robot' | 'cloud' | 'prd';
  setActiveTab: (tab: 'insights' | 'robot' | 'cloud' | 'prd') => void;
  versionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  versionCount
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                PhysioSkill
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Process insights
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Turn work videos into clear, useful process reports
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Human Insights
          </button>

          <button
            onClick={() => setActiveTab('robot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'robot'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Movement details
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all relative ${
              activeTab === 'cloud'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Guepard Cloud
            {versionCount > 0 && (
              <span className="ml-1 text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                {versionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('prd')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'prd'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Product details
          </button>
        </nav>

      </div>
    </header>
  );
};
