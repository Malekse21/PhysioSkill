import type { AnalysisResult, AtomicAction, AtomicPrimitive, DemonstrationOutcome, HumanInsightStep, RobotRecoveryEvent, RobotSceneObject, RobotSpatialRelation, StepCategory } from '../types';

export interface AnalysisOptions {
  taskHint?: string;
  industryHint?: string;
  onProgress?: (progress: number, stage: string) => void;
}

type SampledFrame = { time: number; dataUrl: string };

function clientLog(event: string, details: Record<string, unknown> = {}): void {
  if (/error|failed/i.test(event)) console.error(`[PhysioSkill][client] ${event}`, details);
  else console.info(`[PhysioSkill][client] ${event}`, details);
}

function safeClientError(value: string): string {
  return value
    .replace(/Bearer\s+[^\s"'`]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sk-or-v1-|gsk_|AIza)[A-Za-z0-9_-]{10,}\b/g, '[REDACTED]');
}

export class AIAnalyzerService {
  public static async analyzeVideo(
    videoFile: File | null,
    videoDuration: number,
    videoName: string,
    options: AnalysisOptions = {},
  ): Promise<AnalysisResult> {
    if (!videoFile) throw new Error('Choose a video file to analyze.');

    const samplingStartedAt = Date.now();
    clientLog('frame_sampling.started', { durationSeconds: videoDuration, fileSizeMB: Math.round((videoFile.size / 1024 / 1024) * 10) / 10 });
    let frames: SampledFrame[];
    try {
      frames = await this.sampleVideo(videoFile, videoDuration, options.onProgress);
    } catch (error) {
      clientLog('frame_sampling.failed', { durationMs: Date.now() - samplingStartedAt, error: safeClientError(error instanceof Error ? error.message : 'Frame sampling failed') });
      throw error;
    }
    clientLog('frame_sampling.complete', { frameCount: frames.length, frameTimesSeconds: frames.map(frame => Number(frame.time.toFixed(1))), durationMs: Date.now() - samplingStartedAt });
    options.onProgress?.(42, 'Reviewing video moments…');
    const requestBody = JSON.stringify({ videoName, duration: videoDuration, taskHint: options.taskHint, industryHint: options.industryHint, frames });
    clientLog('analysis_request.started', { payloadBytes: new Blob([requestBody]).size, frameCount: frames.length });
    let response: Response;
    try {
      response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: requestBody,
      });
    } catch (error) {
      clientLog('analysis_request.network_error', { message: safeClientError(error instanceof Error ? error.message : 'Request failed'), errorName: error instanceof Error ? error.name : 'unknown' });
      throw new Error('We couldn’t reach the analysis service. Check your connection and try again.');
    }
    const responseRequestId = response.headers.get('X-Analysis-Request-ID') || 'not-provided';
    clientLog('analysis_request.response', { requestId: responseRequestId, httpStatus: response.status, hasEventStream: Boolean(response.body) });
    if (!response.ok || !response.body) throw new Error('The analysis service is unavailable right now. Please try again.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: AnalysisResult | null = null;
    let streamError = '';
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';
      for (const event of events) {
        const line = event.split(/\r?\n/).find(item => item.startsWith('data:'));
        if (!line) continue;
        let payload: Record<string, unknown>;
        try { payload = JSON.parse(line.slice(5).trim()) as Record<string, unknown>; }
        catch { continue; }
        const requestId = String(payload.requestId || responseRequestId);
        if (payload.type === 'progress') {
          clientLog('analysis_progress', { requestId, progress: Number(payload.progress) || 0, stage: String(payload.stage || 'Working…') });
          options.onProgress?.(Number(payload.progress) || 0, String(payload.stage || 'Working…'));
        } else if (payload.type === 'error') {
          streamError = String(payload.error || 'Analysis failed.');
          clientLog('analysis_error', { requestId, error: safeClientError(streamError) });
        } else if (payload.type === 'result') {
          const resultData = payload.data as Record<string, unknown>;
          clientLog('analysis_result.received', { requestId, stepCount: Array.isArray(resultData?.steps) ? resultData.steps.length : 0, actionCount: Array.isArray(resultData?.atomic_actions) ? resultData.atomic_actions.length : 0 });
          result = this.normalizeResult(resultData, videoName, videoDuration);
        }
      }
      if (done) break;
    }
    if (streamError) throw new Error(streamError);
    if (!result) throw new Error('The analysis ended before results arrived. Please try again.');
    options.onProgress?.(100, 'Analysis complete.');
    clientLog('analysis.complete', { requestId: responseRequestId });
    return result;
  }

  private static sampleVideo(file: File, duration: number, onProgress?: AnalysisOptions['onProgress']): Promise<SampledFrame[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.removeAttribute('src');
        video.load();
      };
      video.onerror = () => { cleanup(); reject(new Error('The browser could not read this video.')); };
      video.onloadedmetadata = async () => {
        try {
          if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            await new Promise<void>((done, fail) => {
              const timeout = window.setTimeout(() => fail(new Error('Timed out while loading the video.')), 12000);
              video.addEventListener('loadeddata', () => { window.clearTimeout(timeout); done(); }, { once: true });
              video.addEventListener('error', () => { window.clearTimeout(timeout); fail(new Error('The browser could not decode this video.')); }, { once: true });
            });
          }
          const actualDuration = Number.isFinite(video.duration) ? video.duration : duration;
          // Eight evenly spaced frames keeps longer clips useful while reducing
          // OpenRouter payload size and Nemotron's visual workload.
          const count = Math.max(2, Math.min(8, Math.ceil(actualDuration / 6)));
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 768 / (video.videoWidth || 768));
          canvas.width = Math.max(1, Math.round((video.videoWidth || 768) * scale));
          canvas.height = Math.max(1, Math.round((video.videoHeight || 432) * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Could not prepare video frames in this browser.');

          const frames: SampledFrame[] = [];
          for (let index = 0; index < count; index += 1) {
            const time = Math.min(Math.max(0, actualDuration - 0.05), (actualDuration * index) / (count - 1));
            if (Math.abs(video.currentTime - time) > 0.025) {
              await new Promise<void>((done, fail) => {
                const timeout = window.setTimeout(() => fail(new Error('Timed out while reading video frames.')), 12000);
                video.onseeked = () => { window.clearTimeout(timeout); video.onseeked = null; done(); };
                video.currentTime = time;
              });
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push({ time, dataUrl: canvas.toDataURL('image/jpeg', 0.72) });
            onProgress?.(8 + Math.round(((index + 1) / count) * 30), `Preparing frame ${index + 1} of ${count}…`);
          }
          cleanup();
          resolve(frames);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };
    });
  }

  private static normalizeResult(raw: Record<string, unknown>, videoName: string, duration: number): AnalysisResult {
    const total = Math.max(1, Number.isFinite(duration) ? duration : 1);
    const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
    const steps: HumanInsightStep[] = rawSteps.map((value, index) => {
      const step = (value || {}) as Record<string, unknown>;
      const start = Math.max(0, Math.min(total, Number(step.start_time) || 0));
      const end = Math.max(start, Math.min(total, Number(step.end_time) || start));
      const allowed: StepCategory[] = ['value_added', 'non_value_added', 'setup', 'inspection', 'idle'];
      const category = allowed.includes(step.category as StepCategory) ? step.category as StepCategory : 'value_added';
      const evidenceScore = Number(step.evidence_score);
      return {
        step_number: index + 1,
        name: String(step.name || `Work step ${index + 1}`),
        start_time: start,
        end_time: end,
        duration: Math.round((end - start) * 10) / 10,
        category,
        summary: String(step.summary || ''),
        ...(Number.isFinite(evidenceScore) ? { evidence_score: evidenceScore, needs_review: Boolean(step.needs_review) } : {}),
      };
    }).filter(step => step.end_time > step.start_time);
    if (!steps.length) throw new Error('We couldn’t identify clear process steps. Try a brighter, steadier video.');

    const rawActions = Array.isArray(raw.atomic_actions) ? raw.atomic_actions : [];
    const primitives: AtomicPrimitive[] = ['pick', 'place', 'move', 'hold', 'wait', 'align', 'press', 'inspect', 'release'];
    const atomicActions: AtomicAction[] = rawActions.map((value, index) => {
      const action = (value || {}) as Record<string, unknown>;
      const box = Array.isArray(action.bounding_box_normalized) ? action.bounding_box_normalized : [0, 0, 0, 0];
      const cleanBox = box.slice(0, 4).map(n => Math.max(0, Math.min(1000, Number(n) || 0)));
      while (cleanBox.length < 4) cleanBox.push(0);
      const primitive = primitives.includes(action.primitive as AtomicPrimitive) ? action.primitive as AtomicPrimitive : 'move';
      const start = Math.max(0, Math.min(total, Number(action.start_sec) || 0));
      const end = Math.max(start, Math.min(total, Number(action.end_sec) || start));
      const approachAngle = Number(action.approach_angle_deg);
      const center = Array.isArray(action.object_center_normalized) && action.object_center_normalized.length >= 2
        ? action.object_center_normalized.slice(0, 2).map(n => Math.max(0, Math.min(1000, Number(n) || 0))) as [number, number]
        : undefined;
      const size = Array.isArray(action.object_size_normalized) && action.object_size_normalized.length >= 2
        ? action.object_size_normalized.slice(0, 2).map(n => Math.max(0, Math.min(1000, Number(n) || 0))) as [number, number]
        : undefined;
      return {
        action_id: index + 1,
        primitive,
        start_sec: start,
        end_sec: end,
        target_object: String(action.target_object || 'visible object'),
        ...(typeof action.secondary_object === 'string' ? { secondary_object: action.secondary_object } : {}),
        ...(typeof action.source_zone === 'string' ? { source_zone: action.source_zone } : {}),
        ...(typeof action.destination_zone === 'string' ? { destination_zone: action.destination_zone } : {}),
        bounding_box_normalized: cleanBox as [number, number, number, number],
        confidence_score: Math.max(0, Math.min(1, Number(action.confidence_score) || 0.5)),
        ...(typeof action.grasp_type === 'string' ? { grasp_type: action.grasp_type } : {}),
        ...(typeof action.suggested_gripper === 'string' ? { suggested_gripper: action.suggested_gripper } : {}),
        ...(typeof action.estimated_force === 'string' ? { estimated_force: action.estimated_force } : {}),
        ...(typeof action.force_evidence === 'string' ? { force_evidence: action.force_evidence } : {}),
        ...(Number.isFinite(approachAngle) ? { approach_angle_deg: approachAngle } : {}),
        ...(center ? { object_center_normalized: center } : {}),
        ...(size ? { object_size_normalized: size } : {}),
      };
    }).filter(action => action.end_sec > action.start_sec);

    const rawSceneGraph = (raw.scene_graph || {}) as Record<string, unknown>;
    const sceneObjects: RobotSceneObject[] = (Array.isArray(rawSceneGraph.objects) ? rawSceneGraph.objects : []).map((value, index) => {
      const object = (value || {}) as Record<string, unknown>;
      const center = Array.isArray(object.center_normalized) && object.center_normalized.length >= 2
        ? object.center_normalized.slice(0, 2).map(n => Math.max(0, Math.min(1000, Number(n) || 0))) as [number, number]
        : undefined;
      const box = Array.isArray(object.bounding_box_normalized) && object.bounding_box_normalized.length >= 4
        ? object.bounding_box_normalized.slice(0, 4).map(n => Math.max(0, Math.min(1000, Number(n) || 0))) as [number, number, number, number]
        : undefined;
      return {
        object_id: String(object.object_id || `object-${index + 1}`),
        label: String(object.label || 'Unclear object'),
        first_seen_sec: Math.max(0, Math.min(total, Number(object.first_seen_sec) || 0)),
        last_seen_sec: Math.max(0, Math.min(total, Number(object.last_seen_sec) || 0)),
        ...(center ? { center_normalized: center } : {}),
        ...(box ? { bounding_box_normalized: box } : {}),
        confidence_score: Math.max(0, Math.min(1, Number(object.confidence_score) || 0.5)),
      };
    });
    const sceneRelations: RobotSpatialRelation[] = (Array.isArray(rawSceneGraph.relations) ? rawSceneGraph.relations : []).map(value => {
      const relation = (value || {}) as Record<string, unknown>;
      return {
        source_object: String(relation.source_object || 'Unknown object'),
        target_object: String(relation.target_object || 'Unknown object'),
        relation: String(relation.relation || 'near'),
        start_sec: Math.max(0, Math.min(total, Number(relation.start_sec) || 0)),
        end_sec: Math.max(0, Math.min(total, Number(relation.end_sec) || 0)),
        confidence_score: Math.max(0, Math.min(1, Number(relation.confidence_score) || 0.5)),
      };
    });
    const allowedOutcomes: DemonstrationOutcome[] = ['successful', 'recovery_observed', 'incomplete_or_failed', 'unclear'];
    const outcome = allowedOutcomes.includes(raw.demonstration_outcome as DemonstrationOutcome)
      ? raw.demonstration_outcome as DemonstrationOutcome
      : 'unclear';
    const recoveryEvents: RobotRecoveryEvent[] = (Array.isArray(raw.recovery_events) ? raw.recovery_events : []).map(value => {
      const event = (value || {}) as Record<string, unknown>;
      return {
        timestamp_sec: Math.max(0, Math.min(total, Number(event.timestamp_sec) || 0)),
        issue: String(event.issue || ''),
        response: String(event.response || ''),
        result: String(event.result || ''),
        confidence_score: Math.max(0, Math.min(1, Number(event.confidence_score) || 0.5)),
      };
    });

    const bottlenecks = (Array.isArray(raw.bottlenecks) ? raw.bottlenecks : []).map((value, index) => {
      const item = (value || {}) as Record<string, unknown>;
      const severities = ['low', 'medium', 'high', 'critical'] as const;
      return {
        id: `ai-bottleneck-${index + 1}`,
        timestamp_range: String(item.timestamp_range || ''),
        severity: severities.includes(item.severity as typeof severities[number]) ? item.severity as typeof severities[number] : 'low',
        impacted_step: String(item.impacted_step || ''),
        description: String(item.description || ''),
        root_cause: String(item.root_cause || 'Not determined from the sampled frames.'),
      };
    });
    const suggestions = (Array.isArray(raw.improvement_suggestions) ? raw.improvement_suggestions : []).map((value, index) => {
      const item = (value || {}) as Record<string, unknown>;
      return {
        id: `ai-suggestion-${index + 1}`,
        category: String(item.category || 'Process'),
        title: String(item.title || 'Review this step'),
        description: String(item.description || ''),
        estimated_time_saved_sec: Math.max(0, Number(item.estimated_time_saved_sec) || 0),
      };
    });
    const efficiency = Math.max(0, Math.min(100, Number(raw.efficiency_score) || 0));
    const cleanName = videoName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    return {
      human_insights: {
        task_name: String(raw.task_name || cleanName || 'Video process'),
        total_duration_seconds: Math.round(total * 10) / 10,
        efficiency_score: efficiency,
        steps,
        bottlenecks,
        improvement_suggestions: suggestions,
        ...(typeof raw.analysis_summary === 'string' ? { analysis_summary: raw.analysis_summary } : {}),
        ...(Array.isArray(raw.follow_up_questions) ? { follow_up_questions: raw.follow_up_questions.map(String).slice(0, 3) } : {}),
        ...(Array.isArray(raw.analysis_warnings) ? { analysis_warnings: raw.analysis_warnings.map(String) } : {}),
      },
      robot_data: {
        dataset_id: `ps_ds_${Date.now()}`,
        timestamp_iso: new Date().toISOString(),
        task_type: String(raw.task_name || cleanName || 'Physical task'),
        environment: 'Inferred from sampled video frames',
        video_metadata: { fps: 30, resolution: 'Sampled from source video', total_frames: Math.round(total * 30) },
        atomic_actions: atomicActions,
        ...(raw.scene_graph && typeof raw.scene_graph === 'object' ? {
          scene_graph: { coordinate_frame: 'image_2d_normalized' as const, objects: sceneObjects, relations: sceneRelations },
        } : {}),
        demonstration_outcome: outcome,
        ...(typeof raw.demonstration_outcome_evidence === 'string' ? { outcome_evidence: raw.demonstration_outcome_evidence } : {}),
        recovery_events: recoveryEvents,
      },
    };
  }
}
