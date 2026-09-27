import React, { useState } from 'react';
import { Cloud, GitCommit, GitBranch, CheckCircle2, RefreshCw, Send, Plus, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GuepardVersion, AnalysisResult } from '../types';
import { GuepardCloudService } from '../services/guepardCloud';

interface GuepardCloudViewProps {
  currentData: AnalysisResult;
  versions: GuepardVersion[];
  onVersionSaved: (newVersion: GuepardVersion) => void;
}

export const GuepardCloudView: React.FC<GuepardCloudViewProps> = ({
  currentData,
  versions,
  onVersionSaved
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<GuepardVersion | null>(
    versions[0] || null
  );
  const [apiLog, setApiLog] = useState<string | null>(null);

  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    setIsSaving(true);
    const newVer = await GuepardCloudService.createVersionSnapshot(
      currentData,
      commitMessage
    );
    setIsSaving(false);
    setCommitMessage('');
    onVersionSaved(newVer);
    setSelectedVersion(newVer);

    // Trigger celebration confetti
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleTestApiSync = async () => {
    if (!selectedVersion) return;
    setApiLog('Sending POST request to https://api.guepard.cloud/v1/projects/physioskill/sync...');
    const result = await GuepardCloudService.syncToGuepardAPI(selectedVersion);
    setApiLog(JSON.stringify(result, null, 2));
  };

  return (
    <div className="space-y-6">
      
      {/* Cloud Header & Save Version Snapshot Form */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Guepard Cloud Workflow & Version Control</h2>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Cloud Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated dataset versioning, audit trail persistence, & cloud workflow synchronization.
              </p>
            </div>
          </div>
        </div>

        {/* Save Version Snapshot Form */}
        <form onSubmit={handleSaveSnapshot} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Enter version change description (e.g., 'v1.1 - Repositioned loupe shadowboard')"
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isSaving || !commitMessage.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isSaving ? 'Saving to Cloud...' : 'Create Snapshot Version'}
          </button>
        </form>

      </div>

      {/* Version History Tree & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Version Timeline */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 border-b border-white/10 pb-3">
            <GitBranch className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Version History Tree</h3>
          </div>

          <div className="space-y-3">
            {versions.map((ver) => {
              const isSelected = selectedVersion?.version === ver.version;
              return (
                <div
                  key={ver.version}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-slate-900/80 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                      {ver.version}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium mt-2 leading-tight">
                    {ver.commit_message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                    <span>{ver.human_insights.steps.length} steps</span>
                    <span>{ver.robot_data.atomic_actions.length} actions</span>
                    <span className="text-emerald-400 font-semibold">✓ Synced</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Version Detail Inspector */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-white/10 space-y-5">
          {selectedVersion ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Snapshot {selectedVersion.version} Inspector
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Created: {new Date(selectedVersion.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTestApiSync}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium border border-purple-500/30 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test REST API Sync
                </button>
              </div>

              {/* Version Specs Summary */}
              <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-white/5 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Cycle Duration</p>
                  <p className="text-base font-bold text-white">
                    {selectedVersion.human_insights.total_duration_seconds}s
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Efficiency Rating</p>
                  <p className="text-base font-bold text-emerald-400">
                    {selectedVersion.human_insights.efficiency_score}/100
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Atomic Primitives</p>
                  <p className="text-base font-bold text-purple-300">
                    {selectedVersion.robot_data.atomic_actions.length}
                  </p>
                </div>
              </div>

              {/* Version Steps Summary List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Version Process Map:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedVersion.human_insights.steps.map((step) => (
                    <div
                      key={step.step_number}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 text-xs text-slate-300 border border-slate-800"
                    >
                      <span className="font-semibold text-white">
                        {step.step_number}. {step.name}
                      </span>
                      <span className="font-mono text-slate-400">
                        {step.duration}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Response Output Box */}
              {apiLog && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Guepard Cloud API Response:
                  </h4>
                  <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300 overflow-x-auto border border-emerald-500/20">
                    <code>{apiLog}</code>
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a version snapshot to inspect metadata.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
