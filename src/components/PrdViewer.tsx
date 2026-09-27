import React, { useState } from 'react';
import { FileText, Copy, Check, Download } from 'lucide-react';

export const PrdViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const prdText = `# PhysioSkill — Product Requirement Document (PRD)

> **Version**: 1.0.0-MVP  
> **Scope**: Free Model-Powered Physical Task Analytics & Robot Data Pipeline  

---

## 1. Executive Summary & Vision

PhysioSkill is an AI-powered physical task analysis system designed to transform short handheld phone videos (30–90 seconds) of human work (packing, sorting, assembling, repairing, market work, manufacturing) into two structured, highly actionable outputs:

1. **Human Insights**: Clear process maps, step timing, detected bottlenecks, and Lean/Ergonomic improvement suggestions for human operators and process managers.
2. **Robot Training Data**: Clean, schema-validated JSON containing atomic manipulation primitives (\`pick\`, \`place\`, \`move\`, \`hold\`, \`wait\`, \`align\`, \`inspect\`), spatial bounding boxes, normalized coordinates, timestamps, and confidence metrics ready for robotics imitation learning / VLA models.
3. **Guepard Cloud Integration**: Automated storage, version control (\`v1.0.0\`, \`v1.1.0\`), diff tracking, and API synchronization.

The app reviews selected video frames, checks the detected steps, and prepares a written process report. Analysis services and availability depend on the app configuration.

---

## 2. Core Value Proposition

| Output Stream | Target Audience | Primary Use Case | Output Format |
|---|---|---|---|
| **Human Insights** | Industrial Engineers, Operations Managers | Cycle-time reduction, bottleneck elimination, SOP generation | Interactive timeline, step table, bottleneck alerts |
| **Robot Training Data** | Robotics Engineers, AI Researchers | Training imitation learning policies, VLA datasets | Standardized Atomic Action JSON, ROS 2 format |
| **Guepard Cloud** | Enterprise DevOps, Workflow Engineers | Version control, audit trail, repository sync | Cloud REST payloads, version history diffs |

---

## 3. Architecture & Free Model Pipeline

- **Browser Video Sampling Engine**: Canvas keyframe extractor (1-2 FPS).
- **Video Analysis**: Selected video frames are reviewed to identify visible steps and actions; service keys remain on the server.
- **Dual Stream Output**: Enforces strict JSON Schema for process maps and atomic robot primitives.
- **Guepard Cloud Persistence**: Saves version snapshots (\`v1.0.0\`, \`v1.1.0\`) to REST API.

---

## 4. Technical Specifications & Data Schemas

### 4.1. Human Insights Schema
- \`task_name\`: String
- \`total_duration_seconds\`: Number
- \`steps\`: Array of \`{ step_number, name, start_time, end_time, duration, category, summary }\`
- \`bottlenecks\`: Array of \`{ id, timestamp_range, severity, description, root_cause }\`
- \`improvement_suggestions\`: Array of \`{ id, category, title, description, estimated_time_saved_sec }\`

### 4.2. Robot Training Data Schema
- \`atomic_actions\`: Array of \`{ action_id, primitive, start_sec, end_sec, target_object, bounding_box_normalized: [ymin, xmin, ymax, xmax], confidence_score }\`
- Allowed primitives: \`["pick", "place", "move", "hold", "wait", "align", "press", "inspect", "release"]\`
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(prdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([prdText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PhysioSkill_PRD.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-amber-500/20 space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">PhysioSkill Product Requirement Document (PRD)</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                v1.0.0 MVP Spec
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Detailed technical PRD for free model integration, data schemas, and Guepard Cloud architecture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied PRD!' : 'Copy PRD'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PRD.md
          </button>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-sans text-xs text-slate-300 space-y-4 leading-relaxed overflow-x-auto max-h-[600px]">
        <pre className="whitespace-pre-wrap font-mono text-slate-300">{prdText}</pre>
      </div>
    </div>
  );
};
