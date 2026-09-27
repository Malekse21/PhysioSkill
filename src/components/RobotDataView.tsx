import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, MapPin, TriangleAlert } from 'lucide-react';
import type { RobotTrainingData, SavedAnalysis } from '../types';

interface RobotDataViewProps {
  robotData: RobotTrainingData;
  processLabel: string;
  history: SavedAnalysis[];
  videoUrl: string;
  onSelectTime: (time: number) => void;
}

const actionLabel: Record<string, string> = {
  pick: 'Pick up', place: 'Set down', release: 'Release', move: 'Move', hold: 'Hold',
  wait: 'Wait', align: 'Line up', inspect: 'Check', press: 'Press',
};

const outcomeLabels = {
  successful: 'Completed',
  recovery_observed: 'Recovery seen',
  incomplete_or_failed: 'Unfinished / failed',
  unclear: 'Unclear from video',
  not_assessed: 'Not assessed',
} as const;

function formatActionTime(seconds: number): string {
  const tenths = Math.max(0, Math.round(seconds * 10));
  const minutes = Math.floor(tenths / 600);
  const remainder = ((tenths % 600) / 10).toFixed(1).padStart(4, '0');
  return `${minutes}:${remainder}`;
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function sequenceFor(record: SavedAnalysis): string {
  return record.result.robot_data.atomic_actions.map(action => action.primitive).join(' → ') || 'No actions detected';
}

export const RobotDataView: React.FC<RobotDataViewProps> = ({ robotData, processLabel, history, videoUrl, onSelectTime }) => {
  const [view, setView] = useState<'actions' | 'json'>('actions');
  const [copied, setCopied] = useState(false);
  const [referenceFrame, setReferenceFrame] = useState('');
  const [frameAspectRatio, setFrameAspectRatio] = useState(16 / 9);
  const actions = robotData.atomic_actions;
  const sceneGraph = robotData.scene_graph;
  const referenceTime = sceneGraph?.reference_time_sec ?? actions[0]?.start_sec ?? 0;
  const actionForMap = actions.find(action => referenceTime >= action.start_sec && referenceTime <= action.end_sec)
    || actions.reduce<(typeof actions)[number] | undefined>((closest, action) => !closest || Math.abs(action.start_sec - referenceTime) < Math.abs(closest.start_sec - referenceTime) ? action : closest, undefined);
  const actionBox = actionForMap?.bounding_box_normalized;
  const fallbackMapObjects = !sceneGraph?.objects.length && actionForMap && actionBox && actionBox.some(value => value !== 0)
    ? [{
      object_id: `action-${actionForMap.action_id}`,
      label: actionForMap.target_object,
      center_normalized: [(actionBox[1] + actionBox[3]) / 2, (actionBox[0] + actionBox[2]) / 2] as [number, number],
      bounding_box_normalized: actionBox,
      confidence_score: actionForMap.confidence_score,
    }]
    : [];
  const mapObjects = (sceneGraph?.objects.length ? sceneGraph.objects : fallbackMapObjects).map(object => {
    const box = object.bounding_box_normalized;
    return {
      ...object,
      center_normalized: object.center_normalized || (box
        ? [(box[1] + box[3]) / 2, (box[0] + box[2]) / 2] as [number, number]
        : undefined),
    };
  });
  const mapRelations = sceneGraph?.relations || [];

  React.useEffect(() => {
    setReferenceFrame('');
    if (!videoUrl) return;
    const video = document.createElement('video');
    let disposed = false;
    const capture = () => {
      if (disposed) return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        video.addEventListener('loadeddata', capture, { once: true });
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context || !canvas.width || !canvas.height) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setFrameAspectRatio(canvas.width / canvas.height);
        setReferenceFrame(canvas.toDataURL('image/jpeg', 0.78));
      } catch {
        setReferenceFrame('');
      }
    };
    const onMetadata = () => {
      const lastFrame = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.05) : referenceTime;
      const target = Math.min(lastFrame, Math.max(0, referenceTime));
      if (target < 0.02) capture();
      else {
        video.addEventListener('seeked', capture, { once: true });
        video.currentTime = target;
      }
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.addEventListener('loadedmetadata', onMetadata, { once: true });
    video.src = videoUrl;
    video.load();
    return () => {
      disposed = true;
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [referenceTime, videoUrl]);
  const objectCounts = actions.reduce<Record<string, number>>((counts, action) => {
    const label = action.target_object.trim();
    if (label && !/^(visible object|unknown object|unknown)$/i.test(label)) counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
  const averageConfidence = actions.length
    ? Math.round(actions.reduce((sum, action) => sum + action.confidence_score, 0) / actions.length * 100)
    : 0;
  const taskKey = normalizeName(processLabel || robotData.task_type);
  const demonstrations = useMemo(() => history
    .filter(record => normalizeName(record.processLabel || record.result.robot_data.task_type) === taskKey)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)), [history, taskKey]);
  const sequenceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    demonstrations.forEach(record => {
      const sequence = sequenceFor(record);
      counts.set(sequence, (counts.get(sequence) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [demonstrations]);
  const outcomeCounts = demonstrations.reduce<Record<string, number>>((counts, record) => {
    const outcome = record.result.robot_data.demonstration_outcome || 'not_assessed';
    counts[outcome] = (counts[outcome] || 0) + 1;
    return counts;
  }, {});

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(robotData, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadJSON = () => download(
    new Blob([JSON.stringify(robotData, null, 2)], { type: 'application/json' }),
    `${robotData.dataset_id}.json`,
  );

  const handleDownloadCSV = () => {
    const columns = ['id', 'action', 'target_object', 'start_sec', 'end_sec', 'source_zone', 'destination_zone', 'approach_angle_deg_image_plane', 'observed_contact', 'suggested_gripper_unvalidated', 'qualitative_force_cue', 'force_evidence', 'object_center_x_0_1000', 'object_center_y_0_1000', 'object_apparent_width_0_1000', 'object_apparent_height_0_1000', 'confidence'];
    const rows = actions.map(action => [
      action.action_id, action.primitive, action.target_object, action.start_sec, action.end_sec,
      action.source_zone, action.destination_zone, action.approach_angle_deg, action.grasp_type, action.suggested_gripper,
      action.estimated_force, action.force_evidence, action.object_center_normalized?.[0],
      action.object_center_normalized?.[1], action.object_size_normalized?.[0],
      action.object_size_normalized?.[1], action.confidence_score,
    ].map(csvCell).join(','));
    download(new Blob([[columns.map(csvCell).join(','), ...rows].join('\n')], { type: 'text/csv' }), `${robotData.dataset_id}.csv`);
  };

  const outcome = robotData.demonstration_outcome || 'not_assessed';

  return <div className="space-y-4">
    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="text-[13px] font-semibold text-[#1d1d1f]">Training demonstration</p><p className="mt-0.5 text-[10px] text-[#8a8a8f]">{robotData.task_type} · {robotData.dataset_id}</p></div>
        <span className="rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-medium text-[#45454a]">{outcomeLabels[outcome]}</span>
      </div>
      {robotData.outcome_evidence && <p className="mt-3 text-[11px] leading-relaxed text-[#6e6e73]">Evidence: {robotData.outcome_evidence}</p>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Actions', value: actions.length },
          { label: 'Named objects', value: Object.keys(objectCounts).length },
          { label: 'Visual confidence', value: actions.length ? `${averageConfidence}%` : '—' },
        ].map(metric => <div key={metric.label} className="rounded-lg bg-[#f5f5f7] px-3 py-2.5">
          <p className="text-[9px] font-medium uppercase tracking-wide text-[#8a8a8f]">{metric.label}</p><p className="mt-1 text-lg font-semibold leading-none text-[#1d1d1f]">{metric.value}</p>
        </div>)}
      </div>
    </section>

    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-4">
      <div className="flex items-center justify-between gap-2"><div><h2 className="text-[13px] font-semibold text-[#1d1d1f]">Object & scene map</h2><p className="mt-0.5 text-[10px] text-[#8a8a8f]">Positions are relative to the image, not real-world coordinates.</p></div><MapPin className="h-4 w-4 text-[#6e6e73]" /></div>
      {mapObjects.length ? <>
        <div className="relative mx-auto mt-3 overflow-hidden rounded-xl border border-[#e5e5ea] bg-[#fafafa]" style={{ width: `min(100%, ${360 * frameAspectRatio}px)`, aspectRatio: frameAspectRatio }} aria-label="Video-frame object map with estimated 2D detections; not a 3D map">
          {referenceFrame && <img src={referenceFrame} alt={`Video frame at ${formatActionTime(referenceTime)}`} className="absolute inset-0 h-full w-full object-fill" />}
          {!referenceFrame && <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49.8%,#e5e5ea_50%,transparent_50.2%),linear-gradient(transparent_49.8%,#e5e5ea_50%,transparent_50.2%)] bg-[#fafafa]" />}
          {mapObjects.length > 1 && <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
            {mapRelations.filter(relation => referenceTime >= relation.start_sec && referenceTime <= relation.end_sec).map((relation, index) => {
              const source = mapObjects.find(object => object.object_id === relation.source_object || object.label === relation.source_object)?.center_normalized;
              const target = mapObjects.find(object => object.object_id === relation.target_object || object.label === relation.target_object)?.center_normalized;
              return source && target ? <line key={`${relation.source_object}-${relation.target_object}-${index}`} x1={source[0]} y1={source[1]} x2={target[0]} y2={target[1]} stroke="#111111" strokeOpacity="0.62" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#scene-arrow)" /> : null;
            })}
            <defs><marker id="scene-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#111111" /></marker></defs>
          </svg>}
          {mapObjects.filter(object => object.center_normalized).map(object => {
            const [x, y] = object.center_normalized!;
            const box = object.bounding_box_normalized;
            return <React.Fragment key={object.object_id}>
              {box && <div className="absolute z-10 border-2 border-black/80 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,.75)]" style={{ left: `${box[1] / 10}%`, top: `${box[0] / 10}%`, width: `${Math.max(1, (box[3] - box[1]) / 10)}%`, height: `${Math.max(1, (box[2] - box[0]) / 10)}%` }} />}
              <div title={`${object.label} · ${Math.round(object.confidence_score * 100)}% confidence`} className="absolute z-20 max-w-[42%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${Math.max(3, Math.min(97, x / 10))}%`, top: `${Math.max(8, Math.min(92, y / 10))}%` }}>
                <span className="inline-flex items-center gap-1 rounded-full border border-black/70 bg-white/95 px-2 py-1 text-[9px] font-medium text-[#1d1d1f] shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-black" />{object.label}</span>
              </div>
            </React.Fragment>;
          })}
          {!mapObjects.some(object => object.center_normalized) && <p className="absolute inset-0 flex items-center justify-center text-[11px] text-[#8a8a8f]">Object positions weren’t clear enough to map.</p>}
          <span className="absolute bottom-2 left-2 rounded bg-white/90 px-1.5 py-1 text-[8px] text-[#45454a]">{referenceFrame ? `Video frame · ${formatActionTime(referenceTime)}` : 'Approximate image map'} · 2D</span>
        </div>
        {!sceneGraph?.objects.length && <p className="mt-2 text-[9px] text-[#8a8a8f]">Showing the closest saved action box; re-analyze for a full scene map.</p>}
        <div className="mt-3 space-y-1.5">
          {sceneGraph?.relations?.slice(0, 6).map((relation, index) => <button key={`${relation.source_object}-${relation.target_object}-${index}`} type="button" onClick={() => onSelectTime(relation.start_sec)} className="flex w-full items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f5f5f7]">
            <span className="text-[10px] leading-relaxed text-[#45454a]"><strong className="font-medium text-[#1d1d1f]">{relation.source_object}</strong> {relation.relation.replace(/_/g, ' ')} <strong className="font-medium text-[#1d1d1f]">{relation.target_object}</strong></span>
            <span className="shrink-0 font-mono text-[9px] text-[#8a8a8f]">{formatActionTime(relation.start_sec)}</span>
          </button>)}
          {!sceneGraph?.relations?.length && <p className="text-[10px] text-[#8a8a8f]">No clear object-to-object movement was identified.</p>}
        </div>
      </> : <div className="mt-3 rounded-xl bg-[#f5f5f7] p-3 text-[11px] text-[#6e6e73]">{sceneGraph ? 'No reliable object map was produced for this clip.' : 'This saved analysis predates object mapping. Re-analyze the clip to generate it.'} A single camera view can show approximate image positions, but not calibrated 3D location or depth.</div>}
    </section>

    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-[13px] font-semibold text-[#1d1d1f]">Action sequence</h2><p className="mt-0.5 text-[10px] text-[#8a8a8f]">Observed actions with image-based estimates where visible.</p></div>
        <div className="flex items-center gap-1 rounded-lg bg-[#f5f5f7] p-0.5">
          {(['actions', 'json'] as const).map(option => <button key={option} type="button" onClick={() => setView(option)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium ${view === option ? 'bg-white text-black shadow-sm' : 'text-[#6e6e73]'}`}>{option === 'actions' ? 'Actions' : 'JSON'}</button>)}
        </div>
      </div>

      {view === 'actions' ? <div className="mt-3 space-y-2">
        {actions.map(action => <article key={action.action_id} className="rounded-xl border border-[#e5e5ea] p-3">
          <button type="button" onClick={() => onSelectTime(action.start_sec)} className="flex w-full items-start justify-between gap-2 text-left">
            <span className="min-w-0"><span className="text-[12px] font-semibold text-[#1d1d1f]">{actionLabel[action.primitive] || action.primitive}</span><span className="ml-1.5 text-[11px] text-[#6e6e73]">{action.target_object}</span></span>
            <span className="shrink-0 font-mono text-[10px] text-[#6e6e73]">{formatActionTime(action.start_sec)}–{formatActionTime(action.end_sec)}</span>
          </button>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {action.grasp_type && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">Observed grip: {action.grasp_type.replace(/_/g, ' ')}</span>}
            {action.suggested_gripper && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">Possible gripper: {action.suggested_gripper.replace(/_/g, ' ')}</span>}
            {typeof action.approach_angle_deg === 'number' && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">Approach: {Math.round(action.approach_angle_deg)}° in image</span>}
            {action.estimated_force && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">Force cue: {action.estimated_force}</span>}
            {action.source_zone && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">From: {action.source_zone}</span>}
            {action.destination_zone && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">To: {action.destination_zone}</span>}
            {action.object_center_normalized && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">Image x/y: {action.object_center_normalized.join(', ')}</span>}
            {action.object_size_normalized && <span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">Apparent size: {action.object_size_normalized.join(' × ')}/1000</span>}
            <span className="rounded-full border border-[#e5e5ea] px-2 py-1 text-[9px] tabular-nums text-[#6e6e73]">{Math.round(action.confidence_score * 100)}% visual confidence</span>
          </div>
          {action.force_evidence && <p className="mt-2 text-[10px] leading-relaxed text-[#8a8a8f]">Force cue evidence: {action.force_evidence}</p>}
          {action.bounding_box_normalized.every(value => value === 0) && <p className="mt-2 flex items-center gap-1 text-[9px] text-[#8a8a8f]"><TriangleAlert className="h-3 w-3" />Object outline unavailable.</p>}
        </article>)}
        {!actions.length && <div className="rounded-xl border border-dashed border-[#d2d2d7] px-4 py-7 text-center text-[11px] text-[#8a8a8f]">No actions were clear enough to include.</div>}
      </div> : <div className="mt-3 overflow-hidden rounded-xl border border-[#e5e5ea]">
        <div className="flex items-center justify-between bg-[#f5f5f7] px-3 py-2"><span className="font-mono text-[9px] text-[#6e6e73]">{robotData.dataset_id}</span><span className="text-[9px] text-[#8a8a8f]">{actions.length} actions</span></div>
        <pre className="max-h-[480px] overflow-auto p-3 text-[10px] leading-relaxed text-[#1d1d1f]"><code>{JSON.stringify(robotData, null, 2)}</code></pre>
      </div>}

      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[#f0f0f2] pt-3">
        <button type="button" onClick={() => void handleCopy()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[10px] text-[#45454a] hover:bg-[#f5f5f7]">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? 'Copied' : 'Copy data'}</button>
        <button type="button" onClick={handleDownloadJSON} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[10px] text-[#45454a] hover:bg-[#f5f5f7]"><Download className="h-3 w-3" />JSON</button>
        <button type="button" onClick={handleDownloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d2d2d7] px-2.5 py-1.5 text-[10px] text-[#45454a] hover:bg-[#f5f5f7]"><Download className="h-3 w-3" />CSV</button>
      </div>
    </section>

    <section className="rounded-2xl border border-[#e5e5ea] bg-white p-4">
      <div className="flex items-center justify-between gap-2"><div><h2 className="text-[13px] font-semibold text-[#1d1d1f]">Variation across demonstrations</h2><p className="mt-0.5 text-[10px] text-[#8a8a8f]">“{processLabel || robotData.task_type}” · {demonstrations.length} saved clip{demonstrations.length === 1 ? '' : 's'}</p></div><span className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#6e6e73]">{sequenceCounts.length > 1 ? 'Sequence varies' : demonstrations.length > 1 ? 'Same sequence' : 'One example'}</span></div>
      {demonstrations.length < 2 ? <p className="mt-3 rounded-xl bg-[#f5f5f7] p-3 text-[11px] leading-relaxed text-[#6e6e73]">Save another video using the same process description to compare clean runs, visible recoveries, and action-order differences.</p> : <>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(['successful', 'recovery_observed', 'incomplete_or_failed', 'unclear', 'not_assessed'] as const).map(key => <div key={key} className="rounded-lg bg-[#f5f5f7] px-2.5 py-2"><p className="text-[9px] leading-tight text-[#6e6e73]">{outcomeLabels[key]}</p><p className="mt-1 text-lg font-semibold leading-none text-[#1d1d1f]">{outcomeCounts[key] || 0}</p></div>)}
        </div>
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-medium text-[#45454a]">Saved video comparison</p>
          {demonstrations.slice(-4).reverse().map(record => {
            const runOutcome = record.result.robot_data.demonstration_outcome || 'not_assessed';
            return <div key={record.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e5ea] px-2.5 py-2">
              <div className="min-w-0"><p className="truncate text-[10px] font-medium text-[#1d1d1f]">{record.name}</p><p className="text-[9px] text-[#8a8a8f]">{new Date(record.createdAt).toLocaleDateString()} · {record.result.robot_data.atomic_actions.length} actions · {formatActionTime(record.duration)} clip</p></div>
              <span className="shrink-0 rounded-full bg-[#f5f5f7] px-2 py-1 text-[9px] text-[#45454a]">{outcomeLabels[runOutcome]}</span>
            </div>;
          })}
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-medium text-[#45454a]">Observed action patterns</p>
          {sequenceCounts.slice(0, 3).map(([sequence, count]) => <div key={sequence} className="flex items-start justify-between gap-3 rounded-lg border border-[#e5e5ea] px-2.5 py-2"><span className="text-[9px] leading-relaxed text-[#6e6e73]">{sequence}</span><span className="shrink-0 text-[9px] font-medium text-[#1d1d1f]">{count} run{count === 1 ? '' : 's'}</span></div>)}
        </div>
      </>}
      {robotData.recovery_events?.length ? <div className="mt-3 border-t border-[#f0f0f2] pt-3"><p className="text-[10px] font-medium text-[#45454a]">Recovery moments in this clip</p><div className="mt-1.5 space-y-1.5">{robotData.recovery_events.map((event, index) => <button key={`${event.timestamp_sec}-${index}`} type="button" onClick={() => onSelectTime(event.timestamp_sec)} className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-[#f5f5f7]"><span className="font-mono text-[9px] text-[#8a8a8f]">{formatActionTime(event.timestamp_sec)} · </span><span className="text-[10px] font-medium text-[#1d1d1f]">{event.issue}</span><span className="block mt-0.5 text-[9px] text-[#6e6e73]">Response: {event.response} · Result: {event.result}</span></button>)}</div></div> : null}
      <p className="mt-3 flex items-start gap-1.5 border-t border-[#f0f0f2] pt-3 text-[9px] leading-relaxed text-[#8a8a8f]"><TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />These are video-derived observations, not validated robot commands. A calibrated depth/stereo camera and robot-specific calibration are needed for metric 3D poses and safe execution.</p>
    </section>
  </div>;
};
