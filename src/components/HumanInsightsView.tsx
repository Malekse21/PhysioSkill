import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Clock3, DollarSign, TrendingUp } from 'lucide-react';
import type { HumanInsightsData, SavedAnalysis } from '../types';

interface HumanInsightsViewProps {
  insights: HumanInsightsData;
  history: SavedAnalysis[];
  onSelectStepTime: (time: number) => void;
}

const workDaysPerWeek = 5;

function normalizeProcessName(name: string): string {
  return name.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function getWasteShare(insights: HumanInsightsData): number {
  if (insights.total_duration_seconds <= 0) return 0;
  const wasteSeconds = insights.steps
    .filter(step => step.category === 'non_value_added' || step.category === 'idle')
    .reduce((sum, step) => sum + step.duration, 0);
  return Math.min(1, Math.max(0, wasteSeconds / insights.total_duration_seconds));
}

function getBottleneckTime(timestampRange: string): number | null {
  const match = timestampRange.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export const HumanInsightsView: React.FC<HumanInsightsViewProps> = ({ insights, history, onSelectStepTime }) => {
  const [hourlyCost, setHourlyCost] = useState(() => localStorage.getItem('ps-owner-hourly-cost') ?? '');
  const [volumePerDay, setVolumePerDay] = useState(() => localStorage.getItem('ps-owner-volume-per-day') ?? '');
  const hourlyCostValue = Math.max(0, Number(hourlyCost) || 0);
  const volumeValue = Math.max(0, Number(volumePerDay) || 0);
  const hasInputs = hourlyCostValue > 0 && volumeValue > 0;
  const weeklyCycles = volumeValue * workDaysPerWeek;
  const weeklyProcessCost = (insights.total_duration_seconds / 3600) * hourlyCostValue * weeklyCycles;
  const avoidableSeconds = Math.min(insights.total_duration_seconds, insights.steps
    .filter(step => step.category === 'non_value_added' || step.category === 'idle')
    .reduce((sum, step) => sum + step.duration, 0));
  const weeklyWasteCost = (avoidableSeconds / 3600) * hourlyCostValue * weeklyCycles;

  const rankedFixes = useMemo(() => [...insights.improvement_suggestions]
    .filter(item => item.estimated_time_saved_sec > 0)
    .sort((a, b) => b.estimated_time_saved_sec - a.estimated_time_saved_sec)
    .slice(0, 2), [insights.improvement_suggestions]);

  const processKey = normalizeProcessName(insights.task_name);
  const trend = useMemo(() => {
    const genericNames = new Set(['', 'video process', 'physical task', 'process workspace']);
    if (genericNames.has(processKey)) return [];
    return history
      .filter(record => normalizeProcessName(record.result.human_insights.task_name) === processKey
        && record.result.human_insights.steps.length > 0
        && record.result.human_insights.total_duration_seconds > 0)
      .map(record => ({
        createdAt: record.createdAt,
        wasteShare: getWasteShare(record.result.human_insights),
      }))
      .filter(record => Number.isFinite(record.wasteShare))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }, [history, processKey]);

  const updateInput = (key: string, setter: (value: string) => void, value: string) => {
    setter(value);
    localStorage.setItem(key, value);
  };

  return <div className="space-y-5">
    {insights.analysis_warnings?.length ? <section role="status" className="rounded-xl border border-[#e5e5ea] bg-white px-4 py-3 text-[12px] text-[#6e6e73]">
      Some details could not be read clearly from this video, so the estimates may be incomplete.
    </section> : null}

    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#f5f5f7] p-2.5 text-black"><DollarSign className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6e6e73]">Estimated labor cost this week</p>
          {hasInputs ? <>
            <p className="mt-1 text-4xl font-semibold tracking-[-0.05em] text-black">{formatCurrency(weeklyProcessCost)}</p>
            <p className="mt-1 text-[12px] text-[#6e6e73]">At {volumeValue.toLocaleString()} cycles per day, 5 days a week, and one worker per cycle.</p>
            <p className="mt-2 text-[12px] font-medium text-[#1d1d1f]">About {formatCurrency(weeklyWasteCost)} of that is tied to waiting or extra movement seen in this clip.</p>
          </> : <p className="mt-1 text-[13px] text-[#6e6e73]">Add your volume and labor cost to estimate what this process costs each week.</p>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#f0f0f2] pt-4">
        <label className="space-y-1.5 text-[11px] font-medium text-[#6e6e73]">
          <span>Units per day</span>
          <input type="number" min="0" value={volumePerDay} onChange={event => updateInput('ps-owner-volume-per-day', setVolumePerDay, event.target.value)} placeholder="e.g. 40" className="w-full rounded-lg border border-[#e5e5ea] bg-[#fafafa] px-3 py-2.5 text-[13px] text-[#1d1d1f] outline-none focus:border-black" />
        </label>
        <label className="space-y-1.5 text-[11px] font-medium text-[#6e6e73]">
          <span>Labor cost per hour ($)</span>
          <input type="number" min="0" step="0.01" value={hourlyCost} onChange={event => updateInput('ps-owner-hourly-cost', setHourlyCost, event.target.value)} placeholder="e.g. 25" className="w-full rounded-lg border border-[#e5e5ea] bg-[#fafafa] px-3 py-2.5 text-[13px] text-[#1d1d1f] outline-none focus:border-black" />
        </label>
      </div>
      <p className="mt-2 text-[10px] text-[#8a8a8f]">Estimate uses the video’s full cycle time. Weekly figures assume 5 workdays and one worker; actual costs may differ.</p>
    </section>

    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
      <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-black" /><h2 className="text-[13px] font-semibold text-[#1d1d1f]">Fix this first</h2></div>
      <p className="mt-1 text-[11px] text-[#8a8a8f]">Highest estimated time recovery per cycle, based on this video.</p>
      {rankedFixes.length ? <div className="mt-4 space-y-3">
        {rankedFixes.map((fix, index) => {
          const savedSeconds = Math.min(fix.estimated_time_saved_sec, insights.total_duration_seconds);
          const weeklyValue = hasInputs ? (savedSeconds * hourlyCostValue * weeklyCycles) / 3600 : null;
          const relatedBottleneck = insights.bottlenecks.find(item => item.impacted_step.toLowerCase().includes(fix.title.toLowerCase()) || fix.title.toLowerCase().includes(item.impacted_step.toLowerCase()));
          const seekTime = relatedBottleneck ? getBottleneckTime(relatedBottleneck.timestamp_range) : null;
          return <article key={fix.id} className="rounded-xl bg-[#f5f5f7] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-[13px] font-semibold text-[#1d1d1f]">{fix.title}</h3>
                  <span className="text-[11px] font-semibold tabular-nums text-[#1d1d1f]">Save ~{savedSeconds}s / cycle</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6e6e73]">{fix.description}</p>
                {weeklyValue !== null && <p className="mt-2 text-[11px] font-medium text-black">Potential labor value: about {formatCurrency(weeklyValue)} / week</p>}
                {relatedBottleneck && <p className="mt-2 text-[10px] text-[#8a8a8f]">Video evidence: {relatedBottleneck.description}</p>}
                {seekTime !== null && <button type="button" onClick={() => onSelectStepTime(seekTime)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#45454a] hover:text-black"><Clock3 className="h-3 w-3" />View this moment</button>}
              </div>
            </div>
          </article>;
        })}
      </div> : <p className="mt-4 rounded-xl bg-[#f5f5f7] p-4 text-[12px] text-[#6e6e73]">There isn’t enough clear evidence in this clip to rank a specific fix yet.</p>}
      <p className="mt-3 text-[10px] text-[#8a8a8f]">Time and dollar savings are estimates from one video. Confirm a change with another run.</p>
    </section>

    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-5">
      <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-black" /><h2 className="text-[13px] font-semibold text-[#1d1d1f]">Is it getting better?</h2></div>
      {trend.length >= 2 ? (() => {
        const previous = trend[trend.length - 2];
        const latest = trend[trend.length - 1];
        const change = (latest.wasteShare - previous.wasteShare) * 100;
        const improved = change < -0.05;
        const unchanged = Math.abs(change) <= 0.05;
        const TrendIcon = improved ? ArrowDownRight : ArrowUpRight;
        return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f5f5f7] p-4">
          <div><p className="text-[11px] text-[#6e6e73]">Time spent waiting or on extra movement · last two saved runs</p><p className="mt-1 text-[19px] font-semibold tracking-tight text-[#1d1d1f]">{Math.round(previous.wasteShare * 100)}% <span className="font-normal text-[#8a8a8f]">→</span> {Math.round(latest.wasteShare * 100)}%</p></div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#e5e5ea] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#45454a]">
            {!unchanged && <TrendIcon className="h-3.5 w-3.5" />}{unchanged ? 'About the same' : `${Math.abs(Math.round(change))} points ${improved ? 'better' : 'higher'}`}
          </div>
        </div>;
      })() : <div className="mt-4 rounded-xl bg-[#f5f5f7] p-4">
        <p className="text-[12px] font-medium text-[#1d1d1f]">Save another run of this process to see the trend.</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#6e6e73]">We compare the share of the cycle spent waiting or on extra movement across saved videos named “{insights.task_name}.”</p>
      </div>}
      {trend.length >= 2 && <p className="mt-2 text-[10px] text-[#8a8a8f]">Compared {new Date(trend[trend.length - 2].createdAt).toLocaleDateString()} with {new Date(trend[trend.length - 1].createdAt).toLocaleDateString()}. Use the same process description for each upload.</p>}
    </section>
  </div>;
};
