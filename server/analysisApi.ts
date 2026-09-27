import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

type Frame = { time: number; dataUrl: string };
type AnalysisRequest = { videoName: string; duration: number; taskHint?: string; industryHint?: string; frames: Frame[] };
type Json = Record<string, any>;

const MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
const REPORT_MODEL = 'openrouter/free';
const MAX_BODY = 50 * 1024 * 1024;
let providerEnv: Record<string, string> = {};

function analysisLog(event: string, details: Json = {}): void {
  const line = `[PhysioSkill][analysis] ${JSON.stringify({ at: new Date().toISOString(), event, ...details })}`;
  if (/error|failed/i.test(event)) console.error(line);
  else console.info(line);
}

function safeLogText(value: string): string {
  return value
    .replace(/Bearer\s+[^\s"'`]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sk-or-v1-|gsk_|AIza)[A-Za-z0-9_-]{10,}\b/g, '[REDACTED]');
}

function providerRequestId(response: Response): string | undefined {
  return response.headers.get('x-request-id') || response.headers.get('x-openrouter-request-id') || undefined;
}

export function analysisApi(): Plugin {
  return {
    name: 'physioskill-analysis-api',
    config(config) {
      providerEnv = loadEnv(config.mode || 'development', config.envDir || process.cwd(), [
        'OPENROUTER_API_KEY', 'TYPESAFE_API_KEY',
      ]);
    },
    configureServer(server) {
      server.middlewares.use('/api/analyze', (req, res) => { void handleAnalysis(req, res); });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/analyze', (req, res) => { void handleAnalysis(req, res); });
    },
  };
}

async function handleAnalysis(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Use POST to analyze a video.' }));
    return;
  }

  const requestId = randomUUID();
  const requestStartedAt = Date.now();
  let stage = 'read_request';
  const sendEvent = (event: Json) => res.write(`data: ${JSON.stringify({ requestId, ...event })}\n\n`);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Analysis-Request-ID': requestId,
  });
  res.flushHeaders?.();
  res.write(': analysis stream ready\n\n');

  analysisLog('request.started', { requestId, method: req.method });
  try {
    const request = await readJsonBody(req) as AnalysisRequest;
    stage = 'validate_frames';
    validateRequest(request);
    analysisLog('request.validated', { requestId, durationSeconds: request.duration, frameCount: request.frames.length, frameTimesSeconds: request.frames.map(frame => Number(frame.time.toFixed(1))) });

    stage = 'read_provider_keys';
    const openRouterKey = requiredKey('OPENROUTER_API_KEY');
    const typeSafeKey = configuredKey('TYPESAFE_API_KEY');
    analysisLog('provider_keys.ready', { requestId, openRouter: true, typeSafe: Boolean(typeSafeKey) });

    sendEvent({ type: 'progress', progress: 48, stage: 'Reviewing selected moments…' });
    stage = 'nemotron_openrouter';
    const visionStartedAt = Date.now();
    const visual = await analyzeFrames(openRouterKey, request, requestId);
    analysisLog('nemotron.complete', { requestId, durationMs: Date.now() - visionStartedAt, stepCount: Array.isArray(visual.steps) ? visual.steps.length : 0, actionCount: Array.isArray(visual.atomic_actions) ? visual.atomic_actions.length : 0 });

    sendEvent({ type: 'progress', progress: 70, stage: 'Checking the steps and writing your report…' });
    stage = 'step_review_and_report';
    const [judgmentsResult, narrativeResult] = await Promise.allSettled([
      typeSafeKey ? classifyEvents(typeSafeKey, visual, request, requestId) : Promise.reject(new Error('Add TYPESAFE_API_KEY to .env.local for Jev review.')),
      writeReport(openRouterKey, visual, request, requestId),
    ]);
    const warnings: string[] = [];
    if (judgmentsResult.status === 'fulfilled') applyJudgments(visual, judgmentsResult.value);
    else warnings.push('Some step confidence checks are unavailable.');
    if (narrativeResult.status === 'fulfilled') Object.assign(visual, narrativeResult.value);
    else {
      warnings.push('The written insights could not be completed. Your detected process steps are still available.');
      visual.analysis_summary = `We found ${Array.isArray(visual.steps) ? visual.steps.length : 0} timed process steps. A written summary and recommendations could not be prepared.`;
      visual.bottlenecks = [];
      visual.improvement_suggestions = [];
      visual.follow_up_questions = [];
    }
    if (warnings.length) visual.analysis_warnings = warnings;

    sendEvent({ type: 'progress', progress: 99, stage: 'Validating timestamps and assembling results…' });
    sendEvent({ type: 'result', data: visual });
    analysisLog('request.complete', { requestId, durationMs: Date.now() - requestStartedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The analysis could not be completed.';
    analysisLog('request.failed', { requestId, stage, durationMs: Date.now() - requestStartedAt, error: safeLogText(message) });
    sendEvent({ type: 'error', error: publicAnalysisError(stage, message) });
  } finally {
    res.end();
  }
}

function publicAnalysisError(stage: string, message: string): string {
  if (stage === 'read_provider_keys' || /api key|invalid api key|unauthorized|401/i.test(message)) {
    return 'The analysis setup needs attention. Check your saved settings, then try again.';
  }
  if (/too much frame data|shorter video/i.test(message)) return 'This video is too large to analyze. Try a shorter clip.';
  if (/could not open|frames could not be prepared|video frame data/i.test(message)) {
    return 'We couldn’t prepare this video. Try another file in MP4, MOV, or WebM format.';
  }
  return 'We couldn’t finish the video analysis. Try again with a shorter, clearer clip.';
}


function requiredKey(name: string): string {
  const value = configuredKey(name);
  if (!value) throw new Error(`Add ${name} to .env.local, then restart the app.`);
  return value;
}

function configuredKey(name: string): string | undefined {
  const value = providerEnv[name]?.trim() || process.env[name]?.trim();
  return value && !value.startsWith('PASTE_') ? value : undefined;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_BODY) throw new Error('This video produced too much frame data. Choose a shorter video.');
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('The video analysis request was incomplete. Please try again.'); }
}

function validateRequest(value: AnalysisRequest): void {
  if (!value || typeof value.videoName !== 'string' || !Number.isFinite(value.duration)) {
    throw new Error('The video frames could not be prepared. Please choose the video again.');
  }
  if (!Array.isArray(value.frames) || value.frames.length < 2 || value.frames.length > 8 || value.frames.some(frame => !Number.isFinite(frame?.time) || typeof frame?.dataUrl !== 'string' || !frame.dataUrl.startsWith('data:image/'))) {
    throw new Error('The video frame data was invalid. Please choose the video again.');
  }
}

function networkFailure(provider: string, error: unknown): Error {
  const cause = error && typeof error === 'object' ? (error as Json).cause : undefined;
  const code = cause && typeof cause === 'object' ? String((cause as Json).code || '') : '';
  if (code === 'EACCES') return new Error(`${provider} was blocked by the local runtime (EACCES) before the API responded. The key and model were not checked. Restart the dev server with outbound network access, then retry.`);
  return new Error(`${provider} network request failed${code ? ` (${code})` : ''}: ${error instanceof Error ? error.message : 'Check your network connection.'}`);
}

async function analyzeFrames(apiKey: string, input: AnalysisRequest, requestId: string): Promise<Json> {
  const content: Array<Json> = [{
    type: 'text',
    text: `Analyze this real physical-work video as a process engineer. Video: ${input.videoName}. Duration: ${input.duration.toFixed(1)} seconds. ${input.taskHint ? `User task hint: ${input.taskHint}.` : ''} ${input.industryHint ? `Industry: ${input.industryHint}.` : ''}\n\nThe attached images are sparse sampled frames from this video in chronological order; each is labeled with its timestamp. Identify only the actual visible work process and actions. Never invent details between sampled frames. Divide the timeline into 3–8 chronological steps covering the full video. Return the complete result by calling submit_process_analysis exactly once. Bounding boxes and image positions use 0–1000 normalized image coordinates; object size is apparent width/height as a fraction of the image, not real-world dimensions. The video has no depth sensor or camera calibration: provide a 2D image-plane position only, never fabricate metric or 3D coordinates. Give approach angle only when the direction is clearly visible in the image plane. Describe a grip as observed human/tool contact, not as a validated robot gripper command. Force cues are qualitative only and require visible deformation or careful handling evidence; never output force/pressure values. Mark uncertain fields unknown or omit them. Classify outcome as successful only if completion is visible, incomplete_or_failed only if an unresolved failure is visible, recovery_observed only if a mistake and response are both visible, otherwise unclear. Recovery events must cite visible evidence. Include relationships such as held_by, inside, on_top_of, left_of, right_of, or moved_to, with timestamps. Do not infer a worker's exact 3D pose. All timestamps must fit within ${input.duration.toFixed(1)} seconds; all confidence scores are 0–1. Keep the data concise.`,
  }];
  for (const frame of input.frames) {
    content.push({ type: 'text', text: `Frame at ${frame.time.toFixed(1)} seconds:` });
    content.push({ type: 'image_url', image_url: { url: frame.dataUrl } });
  }

  let response: Response;
  const providerStartedAt = Date.now();
  analysisLog('openrouter.request.started', { requestId, model: MODEL, frameCount: input.frames.length });
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 4500,
        reasoning: { enabled: false },
        messages: [{ role: 'user', content }],
        tools: [{ type: 'function', function: { name: 'submit_process_analysis', description: 'Return the video process analysis as structured data.', parameters: analysisSchema() } }],
        tool_choice: { type: 'function', function: { name: 'submit_process_analysis' } },
      }),
    });
  } catch (error) {
    const failure = networkFailure('Nemotron via OpenRouter', error);
    const cause = error && typeof error === 'object' ? (error as Json).cause : undefined;
    analysisLog('openrouter.network_error', { requestId, model: MODEL, durationMs: Date.now() - providerStartedAt, code: cause && typeof cause === 'object' ? (cause as Json).code : undefined, error: safeLogText(failure.message) });
    throw failure;
  }
  const payload = await response.json().catch(() => ({})) as Json;
  const message = payload?.choices?.[0]?.message;
  const toolCalls = message?.tool_calls;
  const contentText = Array.isArray(message?.content)
    ? message.content.map((part: Json) => typeof part?.text === 'string' ? part.text : '').filter(Boolean).join('\n')
    : message?.content;
  analysisLog('openrouter.response', {
    requestId,
    providerRequestId: providerRequestId(response),
    model: payload?.model || MODEL,
    httpStatus: response.status,
    durationMs: Date.now() - providerStartedAt,
    finishReason: payload?.choices?.[0]?.finish_reason || null,
    toolCallCount: Array.isArray(toolCalls) ? toolCalls.length : 0,
    contentLength: typeof contentText === 'string' ? contentText.length : 0,
    promptTokens: payload?.usage?.prompt_tokens,
    completionTokens: payload?.usage?.completion_tokens,
    errorCode: payload?.error?.code,
  });
  if (!response.ok) {
    const detail = payload?.error?.message || `OpenRouter request failed (${response.status}).`;
    analysisLog('openrouter.http_error', { requestId, httpStatus: response.status, error: safeLogText(String(detail)) });
    throw new Error(`OpenRouter request failed (${response.status}): ${detail}`);
  }
  const toolArguments = message?.tool_calls?.find((call: Json) => call.function?.name === 'submit_process_analysis')?.function?.arguments
    ?? (message?.function_call?.name === 'submit_process_analysis' ? message.function_call.arguments : undefined);
  if (typeof toolArguments === 'string') return parseJson(toolArguments, 'Nemotron');
  if (toolArguments && typeof toolArguments === 'object') return toolArguments as Json;

  // Some OpenRouter/model combinations return structured JSON in message.content
  // even when a tool was requested. Accept that valid response instead of failing.
  if (typeof contentText === 'string' && contentText.trim()) return parseJson(contentText, 'Nemotron');
  if (message?.refusal) throw new Error(`Nemotron could not analyze this video: ${String(message.refusal)}`);
  throw new Error(`Nemotron returned no process data (finish reason: ${String(payload?.choices?.[0]?.finish_reason || 'unknown')}). Please retry.`);
}

function analysisSchema(): Json {
  return {
    type: 'object',
    properties: {
      task_name: { type: 'string' },
      efficiency_score: { type: 'number' },
      steps: { type: 'array', items: { type: 'object', properties: {
        name: { type: 'string' }, start_time: { type: 'number' }, end_time: { type: 'number' },
        category: { type: 'string', enum: ['setup', 'value_added', 'non_value_added', 'inspection', 'idle'] }, summary: { type: 'string' },
      }, required: ['name', 'start_time', 'end_time', 'category', 'summary'] } },
      atomic_actions: { type: 'array', items: { type: 'object', properties: {
        primitive: { type: 'string', enum: ['pick', 'place', 'move', 'hold', 'wait', 'align', 'press', 'inspect', 'release'] },
        start_sec: { type: 'number' }, end_sec: { type: 'number' }, target_object: { type: 'string' },
        secondary_object: { type: 'string' }, source_zone: { type: 'string' }, destination_zone: { type: 'string' },
        approach_angle_deg: { type: 'number', description: 'Visible image-plane approach direction from -180 to 180 degrees; omit if unclear.' },
        grasp_type: { type: 'string', description: 'Observed contact, such as human pinch, power grip, or tool contact.' },
        suggested_gripper: { type: 'string', enum: ['parallel', 'suction', 'multi_finger', 'tool', 'unknown'], description: 'Unvalidated robot end-effector candidate; use unknown unless clearly supported.' },
        estimated_force: { type: 'string', enum: ['light', 'moderate', 'firm', 'unknown'], description: 'Qualitative visual cue only, not force units.' },
        force_evidence: { type: 'string' },
        object_center_normalized: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2, description: 'Image x,y from 0 to 1000.' },
        object_size_normalized: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2, description: 'Apparent width,height from 0 to 1000; not metric dimensions.' },
        bounding_box_normalized: { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4 }, confidence_score: { type: 'number' },
      }, required: ['primitive', 'start_sec', 'end_sec', 'target_object', 'bounding_box_normalized', 'confidence_score'] } },
      scene_graph: { type: 'object', properties: {
        objects: { type: 'array', items: { type: 'object', properties: {
          object_id: { type: 'string' }, label: { type: 'string' }, first_seen_sec: { type: 'number' }, last_seen_sec: { type: 'number' },
          center_normalized: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
          bounding_box_normalized: { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4 }, confidence_score: { type: 'number' },
        }, required: ['object_id', 'label', 'first_seen_sec', 'last_seen_sec', 'confidence_score'] } },
        relations: { type: 'array', items: { type: 'object', properties: {
          source_object: { type: 'string' }, target_object: { type: 'string' }, relation: { type: 'string' },
          start_sec: { type: 'number' }, end_sec: { type: 'number' }, confidence_score: { type: 'number' },
        }, required: ['source_object', 'target_object', 'relation', 'start_sec', 'end_sec', 'confidence_score'] } },
      }, required: ['objects', 'relations'] },
      demonstration_outcome: { type: 'string', enum: ['successful', 'recovery_observed', 'incomplete_or_failed', 'unclear'] },
      demonstration_outcome_evidence: { type: 'string' },
      recovery_events: { type: 'array', items: { type: 'object', properties: {
        timestamp_sec: { type: 'number' }, issue: { type: 'string' }, response: { type: 'string' }, result: { type: 'string' }, confidence_score: { type: 'number' },
      }, required: ['timestamp_sec', 'issue', 'response', 'result', 'confidence_score'] } },
    },
    required: ['task_name', 'efficiency_score', 'steps', 'atomic_actions', 'scene_graph', 'demonstration_outcome', 'demonstration_outcome_evidence', 'recovery_events'],
  };
}

async function classifyEvents(apiKey: string, visual: Json, input: AnalysisRequest, requestId: string): Promise<Json> {
  const steps = Array.isArray(visual.steps) ? visual.steps.slice(0, 8) : [];
  if (!steps.length) return {};
  const state = { video: input.videoName, duration_seconds: input.duration, task_hint: input.taskHint || '', observed_steps: steps };
  const questions: Json = {};
  steps.forEach((_: Json, index: number) => {
    questions[`step_${index + 1}_category`] = {
      type: 'choice',
      instructions: `Classify observed_steps[${index}] using only its name and summary. Choose the best-supported process category. If evidence is ambiguous, choose the closest category and rely on the evidence score to flag review.`,
      criteria: {
        setup: 'Preparing tools, materials, or the work area before the main operation.',
        value_added: 'Directly transforming, assembling, or delivering the product or service.',
        non_value_added: 'Motion or handling that does not directly advance the task.',
        inspection: 'Checking, measuring, or verifying the item or work.',
        idle: 'Waiting or no productive action is visible.',
      },
    };
    questions[`step_${index + 1}_evidence`] = {
      type: 'score',
      instructions: `How strong is the visual evidence described for observed_steps[${index}]? Judge only the clarity and specificity of the observation, not whether the action is desirable.`,
      criteria: ['Weak or ambiguous evidence; a person should verify this event.', 'Some evidence, but details or boundaries are uncertain.', 'Clear, specific evidence supports the event label.'],
    };
  });

  let response: Response;
  const providerStartedAt = Date.now();
  analysisLog('typesafe.request.started', { requestId, model: 'jev-latest', stepCount: steps.length });
  try {
    response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'jev-latest', state, questions }),
    });
  } catch (error) {
    const failure = networkFailure('TypeSafe Jev review', error);
    analysisLog('typesafe.network_error', { requestId, durationMs: Date.now() - providerStartedAt, error: safeLogText(failure.message) });
    throw failure;
  }
  const payload = await response.json().catch(() => ({})) as Json;
  analysisLog('typesafe.response', { requestId, providerRequestId: providerRequestId(response), httpStatus: response.status, durationMs: Date.now() - providerStartedAt, answerCount: Object.keys(payload.answers || {}).length });
  if (!response.ok) {
    const detail = payload?.error?.message || `TypeSafe Jev request failed (${response.status}).`;
    analysisLog('typesafe.http_error', { requestId, httpStatus: response.status, error: safeLogText(String(detail)) });
    throw new Error(`TypeSafe Jev request failed (${response.status}): ${detail}`);
  }
  return payload.answers || {};
}

async function writeReport(apiKey: string, visual: Json, input: AnalysisRequest, requestId: string): Promise<Json> {
  const model = REPORT_MODEL;
  let response: Response;
  const providerStartedAt = Date.now();
  analysisLog('openrouter.report.request.started', { requestId, model });
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 2400,
        messages: [
          { role: 'system', content: 'You are a concise process-analysis specialist. Use only the supplied observed data. Never invent root causes, timings, or savings. If a cause or saving cannot be supported, say it is unknown and use 0. Return a process report by calling submit_process_report exactly once. Recommendations should be specific, evidence-linked, and distinguish observation from hypothesis.' },
          { role: 'user', content: JSON.stringify({ video: input.videoName, task_hint: input.taskHint || '', industry_hint: input.industryHint || '', duration_seconds: input.duration, observed_process: visual }) },
        ],
        tools: [{ type: 'function', function: { name: 'submit_process_report', description: 'Return the written process report as structured data.', parameters: reportSchema() } }],
        tool_choice: { type: 'function', function: { name: 'submit_process_report' } },
      }),
    });
  } catch (error) {
    const failure = networkFailure('OpenRouter report', error);
    analysisLog('openrouter.report.network_error', { requestId, model, durationMs: Date.now() - providerStartedAt, error: safeLogText(failure.message) });
    throw failure;
  }
  const payload = await response.json().catch(() => ({})) as Json;
  const message = payload?.choices?.[0]?.message;
  const toolCalls = message?.tool_calls;
  const reportContent = message?.content;
  analysisLog('openrouter.report.response', { requestId, providerRequestId: providerRequestId(response), model: payload?.model || model, httpStatus: response.status, durationMs: Date.now() - providerStartedAt, toolCallCount: Array.isArray(toolCalls) ? toolCalls.length : 0, contentLength: typeof reportContent === 'string' ? reportContent.length : 0, finishReason: payload?.choices?.[0]?.finish_reason || null });
  if (!response.ok) {
    const detail = payload?.error?.message || `OpenRouter report request failed (${response.status}).`;
    analysisLog('openrouter.report.http_error', { requestId, httpStatus: response.status, error: safeLogText(String(detail)) });
    throw new Error(`OpenRouter report request failed (${response.status}): ${detail}`);
  }
  const reportArguments = toolCalls?.find((call: Json) => call.function?.name === 'submit_process_report')?.function?.arguments;
  if (typeof reportArguments === 'string') return parseJson(reportArguments, 'OpenRouter report');
  if (reportArguments && typeof reportArguments === 'object') return reportArguments as Json;
  if (typeof reportContent === 'string' && reportContent.trim()) return parseJson(reportContent, 'OpenRouter report');
  throw new Error(`OpenRouter report returned no structured result (finish reason: ${String(payload?.choices?.[0]?.finish_reason || 'unknown')}).`);
}

function reportSchema(): Json {
  return {
    type: 'object',
    properties: {
      analysis_summary: { type: 'string' },
      bottlenecks: { type: 'array', items: { type: 'object', properties: {
        timestamp_range: { type: 'string' }, severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        impacted_step: { type: 'string' }, description: { type: 'string' }, root_cause: { type: 'string' },
      }, required: ['timestamp_range', 'severity', 'impacted_step', 'description', 'root_cause'] } },
      improvement_suggestions: { type: 'array', items: { type: 'object', properties: {
        category: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, estimated_time_saved_sec: { type: 'number' },
      }, required: ['category', 'title', 'description', 'estimated_time_saved_sec'] } },
      follow_up_questions: { type: 'array', items: { type: 'string' } },
    },
    required: ['analysis_summary', 'bottlenecks', 'improvement_suggestions', 'follow_up_questions'],
  };
}

function applyJudgments(visual: Json, answers: Json) {
  if (!Array.isArray(visual.steps)) return;
  const allowed = new Set(['setup', 'value_added', 'non_value_added', 'inspection', 'idle']);
  visual.steps.forEach((step: Json, index: number) => {
    const category = answers[`step_${index + 1}_category`];
    const evidence = answers[`step_${index + 1}_evidence`];
    if (category?.type === 'choice' && allowed.has(category.choice)) step.category = category.choice;
    const score = Number(evidence?.score);
    if (Number.isFinite(score)) {
      step.evidence_score = Math.max(0, Math.min(2, score));
      step.needs_review = score < 1.25;
    }
  });
}

function parseJson(text: string, provider: string): Json {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  if (start < 0) throw new Error(`${provider} returned data in an unexpected format. Please retry.`);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) {
      try { return JSON.parse(cleaned.slice(start, index + 1)) as Json; }
      catch { break; }
    }
  }
  throw new Error(`${provider} returned malformed structured data. Please retry.`);
}

