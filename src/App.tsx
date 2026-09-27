import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Cpu, Activity, Upload, History, Trash2 } from 'lucide-react';
import { VideoCanvasPlayer } from './components/VideoCanvasPlayer';
import { HumanInsightsView } from './components/HumanInsightsView';
import { RobotDataView } from './components/RobotDataView';
import type { AnalysisResult, SavedAnalysis } from './types';
import { AIAnalyzerService } from './services/aiAnalyzer';
import { AnalysisHistory } from './services/analysisHistory';

const ACTIVE_ANALYSIS_STORAGE_KEY = 'physioskill-active-analysis-id';
const ACTIVE_TAB_STORAGE_KEY = 'physioskill-active-tab';

export function App() {
  const [activeTab, setActiveTab] = useState<'insights' | 'robot'>(() =>
    localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) === 'robot' ? 'robot' : 'insights',
  );
  const [currentData, setCurrentData] = useState<AnalysisResult | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedTime, setSelectedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageText, setStageText] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [taskHint, setTaskHint] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [activeRecordId, setActiveRecordId] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    if (!isAnalyzing) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setAnalysisElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setAnalysisError('Choose a video file in MP4, MOV, or WebM format.');
      return;
    }
    const url = selectedFile === file && videoUrl ? videoUrl : URL.createObjectURL(file);
    setVideoUrl(url);
    setSelectedFile(file);
    setCurrentData(null);
    setActiveRecordId('');
    localStorage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
    setSelectedTime(0);
    setElapsedTime(0);
    setAnalysisElapsed(0);
    setAnalysisProgress(0);
    setVideoDuration(0);
    setAnalysisError('');
    setIsAnalyzing(true);
    setStageText('Loading video…');

    try {
      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      const duration = await new Promise<number>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Timed out while loading the video.')), 15000);
        tempVideo.onloadedmetadata = () => { window.clearTimeout(timeout); resolve(tempVideo.duration || 45); };
        tempVideo.onerror = () => { window.clearTimeout(timeout); reject(new Error('The browser could not open this video file.')); };
      });
      setVideoDuration(duration);

      const result = await AIAnalyzerService.analyzeVideo(file, duration, file.name, {
        taskHint: taskHint.trim(),
        onProgress: (progress, stage) => { setAnalysisProgress(progress); setStageText(stage); },
      });
      setCurrentData(result);
      const record = AnalysisHistory.create(file.name, duration, result, file);
      await AnalysisHistory.save(record);
      setActiveRecordId(record.id);
      localStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, record.id);
      setHistory(existing => [record, ...existing.filter(item => item.id !== record.id)]);
      setSelectedTime(0);
      setElapsedTime(0);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Video analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setStageText('');
    }
  }, [selectedFile, videoUrl, taskHint]);

  const openSavedAnalysis = useCallback((record: SavedAnalysis) => {
    setCurrentData(record.result);
    setVideoDuration(record.duration);
    setSelectedTime(0);
    setElapsedTime(0);
    setActiveRecordId(record.id);
    setSelectedFile(null);
    setVideoUrl(record.video ? URL.createObjectURL(record.video) : '');
    setAnalysisError('');
    localStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, record.id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void AnalysisHistory.list().then(items => {
      if (cancelled) return;
      setHistory(items);
      const savedId = localStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY);
      const savedAnalysis = items.find(item => item.id === savedId);
      if (savedAnalysis) openSavedAnalysis(savedAnalysis);
    }).catch(() => {
      if (!cancelled) setHistory([]);
    });
    return () => { cancelled = true; };
  }, [openSavedAnalysis]);

  const changeActiveTab = (tab: 'insights' | 'robot') => {
    setActiveTab(tab);
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  };

  const deleteSavedAnalysis = async (id: string) => {
    await AnalysisHistory.remove(id).catch(() => undefined);
    setHistory(items => items.filter(item => item.id !== id));
    if (activeRecordId === id) {
      setActiveRecordId('');
      setCurrentData(null);
      setSelectedFile(null);
      setVideoUrl('');
      localStorage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.currentTarget.value = '';
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
  };

  const analysisStages = [
    { label: 'Prepare the video', completeAt: 48 },
    { label: 'Map the process', completeAt: 70 },
    { label: 'Writing your report', completeAt: 99 },
    { label: 'Finish your report', completeAt: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e5e5ea] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-black"><span className="text-[10px] font-bold leading-none tracking-tight text-white">PS</span></div>
          <span className="text-[15px] font-semibold tracking-tight">PhysioSkill</span>
        </div>
        <div className="flex items-center rounded-full border border-[#e5e5ea] bg-[#f5f5f7] p-1">
          <button onClick={() => changeActiveTab('insights')} className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${activeTab === 'insights' ? 'bg-black text-white shadow-sm' : 'text-[#6e6e73] hover:text-black'}`}>Human</button>
          <button onClick={() => changeActiveTab('robot')} className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${activeTab === 'robot' ? 'bg-black text-white shadow-sm' : 'text-[#6e6e73] hover:text-black'}`}>Robot</button>
        </div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${isAnalyzing ? 'animate-pulse bg-black' : currentData ? 'bg-[#6e6e73]' : 'bg-[#c7c7cc]'}`} /><span className="max-w-64 truncate text-[11px] font-medium text-[#6e6e73]">{isAnalyzing ? 'Analysis in progress' : currentData?.human_insights.task_name || 'Process workspace'}</span></div></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8a8f]">Your work video</p><h1 className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-black sm:text-[30px]">Process report</h1></div>
          <p className="text-[12px] text-[#8a8a8f]">Observe the work. Find the opportunity.</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
          {/* Results: stay empty until the uploaded video analysis completes. */}
          <section className="min-w-0 space-y-5">
            {currentData && videoDuration > 0 && <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#f5f5f7] p-2.5 text-black"><Clock3 className="h-5 w-5" /></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#6e6e73]">Process timer</p><p className="mt-0.5 text-[11px] text-[#8a8a8f]">Elapsed video time / total cycle</p></div>
                </div>
                <p className="font-mono text-2xl font-semibold tabular-nums text-[#1d1d1f]">{formatTime(elapsedTime)}<span className="mx-1 text-[#aeaeb2]">/</span><span className="text-[#6e6e73]">{formatTime(videoDuration)}</span></p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ececf0]"><div className="h-full rounded-full bg-black transition-[width] duration-300" style={{ width: `${Math.min(100, (elapsedTime / (videoDuration || 1)) * 100)}%` }} /></div>
            </div>}

            {currentData ? <>
              <div hidden={activeTab !== 'insights'}>
                <HumanInsightsView insights={currentData.human_insights} history={history} onSelectStepTime={setSelectedTime} />
              </div>
              <div hidden={activeTab !== 'robot'}>
                <RobotDataView robotData={currentData.robot_data} history={history} onSelectTime={setSelectedTime} />
              </div>
            </> : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-[#e5e5ea] bg-white px-8 py-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
                {isAnalyzing ? <>
                  <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-black text-white shadow-lg shadow-black/15">
                    <Activity className="h-7 w-7 animate-pulse" />
                    <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-[#8a8a8f]" />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[#e5e5ea] bg-white px-3 py-1 text-[11px] font-medium text-[#6e6e73]"><Clock3 className="h-3.5 w-3.5 text-black" /> Analysis time <span className="font-mono tabular-nums text-[#1d1d1f]">{formatTime(analysisElapsed)}</span></div>
                  <h2 className="mt-4 text-base font-semibold text-[#1d1d1f]">Your analysis is in progress</h2>
                  <p className="mt-1 max-w-sm text-sm text-[#6e6e73]">{stageText || 'Preparing the video for analysis…'}</p>
                  <div className="mt-6 h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#e5e5ea]">
                    <div className="h-full rounded-full bg-black transition-[width] duration-700" style={{ width: `${Math.max(5, analysisProgress)}%` }} />
                  </div>
                  <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2 text-left">
                    {analysisStages.map((stage, index) => {
                      const complete = analysisProgress >= stage.completeAt;
                      const active = !complete && (index === 0 || analysisProgress >= analysisStages[index - 1].completeAt);
                      return <div key={stage.label} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] transition-colors ${complete ? 'border-[#d2d2d7] bg-[#f5f5f7] text-[#45454a]' : active ? 'border-black bg-[#f5f5f7] text-black' : 'border-[#ececf0] bg-white text-[#a1a1a6]'}`}>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${complete ? 'bg-[#6e6e73]' : active ? 'animate-pulse bg-black' : 'bg-[#c7c7cc]'}`} />{stage.label}
                      </div>;
                    })}
                  </div>
                </> : analysisError ? <>
                  <div className="mb-4 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] p-3 text-black"><AlertCircle className="h-5 w-5" /></div>
                  <h2 className="text-base font-semibold text-[#1d1d1f]">Analysis didn’t finish</h2>
                  <p role="alert" className="mt-2 max-w-md text-sm text-[#6e6e73]">{analysisError}</p>
                </> : <>
                  <div className="mb-4 rounded-xl bg-[#f5f5f7] p-3 text-black"><Activity className="h-5 w-5" /></div>
                  <h2 className="text-base font-semibold text-[#1d1d1f]">Your results will appear here</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6e6e73]">Upload a work video to see its steps, timing, and opportunities to improve.</p>
                </>}
              </div>
            )}
          </section>

          {/* Upload and video preview */}
          <section className="min-w-0 space-y-5">
            {currentData && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e5e5ea] bg-white px-3.5 py-2.5 text-xs text-[#45454a]"><CheckCircle2 className="h-4 w-4 text-black" /> Your report is ready</div>}
            {analysisError && currentData && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-3 text-xs text-[#45454a]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-black" /><span>{analysisError}</span></div>}
            {analysisError && selectedFile && !isAnalyzing && <button type="button" onClick={() => void handleFile(selectedFile)} className="w-full rounded-lg border border-[#e5e5ea] bg-white px-3 py-2.5 text-xs font-semibold text-black hover:border-black">Try again</button>}
            <label
              onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-white transition-colors ${isDragging ? 'border-black bg-[#f5f5f7]' : 'border-[#c7c7cc] hover:border-black hover:bg-[#fafafa]'}`}
            >
              {isAnalyzing ? <div className="flex items-center gap-2 text-[13px] text-[#6e6e73]"><span className="spinner" />{stageText}</div> : <>
                <Upload className="h-5 w-5 text-black" />
                <span className="text-center text-[13px] text-[#6e6e73]">Drop a video or <span className="font-semibold text-black underline underline-offset-2">browse</span></span>
                <span className="text-[11px] text-[#aeaeb2]">MP4, MOV, or WebM</span>
              </>}
              <input type="file" accept="video/*" onChange={handleFileInput} className="hidden" disabled={isAnalyzing} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73]">What process should we look for? <span className="font-normal normal-case tracking-normal text-[#a1a1a6]">Optional</span></span>
              <input value={taskHint} onChange={event => setTaskHint(event.target.value)} disabled={isAnalyzing} placeholder="e.g. packing an order, assembling a part…" className="w-full rounded-xl border border-[#e5e5ea] bg-white px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-[#fafafa]" />
            </label>

            {videoUrl ? <VideoCanvasPlayer
              videoUrl={videoUrl}
              analysisData={currentData || undefined}
              selectedTime={selectedTime}
              onTimeUpdate={setElapsedTime}
            /> : <div className="flex aspect-video items-center justify-center rounded-2xl border border-[#e5e5ea] bg-white text-center shadow-[0_8px_30px_rgba(0,0,0,0.035)]">
              <div className="max-w-xs px-6"><div className="mx-auto mb-3 w-fit rounded-xl bg-[#f5f5f7] p-3 text-black"><Cpu className="h-5 w-5" /></div><p className="text-sm font-semibold text-[#1d1d1f]">Video preview</p><p className="mt-1 text-xs leading-relaxed text-[#6e6e73]">Your video will appear here after you upload it.</p></div>
            </div>}
            {videoUrl && <p className="text-[11px] leading-relaxed text-[#8a8a8f]">We review selected moments from your video. Very brief actions may not appear in the report.</p>}

            <section className="rounded-2xl border border-[#e5e5ea] bg-white p-4">
              <div className="flex items-center gap-2"><History className="h-4 w-4 text-black" /><h2 className="text-[13px] font-semibold text-[#1d1d1f]">Saved analyses</h2><span className="ml-auto rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] text-[#6e6e73]">{history.length}</span></div>
              <p className="mt-1 text-[10px] text-[#8a8a8f]">Reports and clips stay in this browser. Delete them here any time.</p>
              {history.length > 2 && <input value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Search saved reports…" className="mt-3 w-full rounded-lg border border-[#e5e5ea] px-3 py-2 text-xs outline-none focus:border-black" />}
              <div className="mt-2 max-h-48 space-y-1 overflow-auto">
                {history.filter(item => item.name.toLowerCase().includes(historyQuery.toLowerCase())).slice(0, 8).map(item => <div key={item.id} className={`flex items-center gap-2 rounded-lg px-2 py-2 ${activeRecordId === item.id ? 'bg-[#f5f5f7]' : 'hover:bg-[#fafafa]'}`}>
                  <button onClick={() => openSavedAnalysis(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-medium text-[#1d1d1f]">{item.name}</span><span className="block text-[10px] text-[#8a8a8f]">{new Date(item.createdAt).toLocaleString()} · Process report</span></button>
                  <button onClick={() => void deleteSavedAnalysis(item.id)} aria-label={`Delete ${item.name}`} className="rounded p-1.5 text-[#aeaeb2] hover:bg-white hover:text-black"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>)}
                {history.length === 0 && <p className="py-2 text-[11px] text-[#8a8a8f]">Completed reports are saved in this browser.</p>}
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
