# PhysioSkill — Product Requirement Document (PRD)

> **Version**: 1.0.0-MVP  
> **Target Release**: Q3 2026  
> **Scope**: Zero-Cost / Free Model-Powered Physical Task Analytics & Robot Data Pipeline  

---

## 1. Executive Summary & Vision

**PhysioSkill** is an AI-powered physical task analysis system designed to transform short handheld phone videos (30–90 seconds) of human work (packing, sorting, assembling, repairing, market work, manufacturing) into two structured, highly actionable outputs:

1. **Human Insights**: Clear process maps, step timing, detected bottlenecks, and Lean/Ergonomic improvement suggestions for human operators and process managers.
2. **Robot Training Data**: Clean, schema-validated JSON containing atomic manipulation primitives (`pick`, `place`, `move`, `hold`, `wait`, `align`, `inspect`), spatial bounding boxes, normalized coordinates, timestamps, and confidence metrics ready for robotics imitation learning / VLA models.
3. **Guepard Cloud Integration**: Automated storage, version control (`v1.0.0`, `v1.1.0`), diff tracking, and API synchronization.

The MVP uses a server-side AI pipeline: Nemotron 3 through OpenRouter for sampled video frames, TypeSafe Jev for event review, and Groq for report writing. Provider availability and usage costs depend on the configured accounts.

---

## 2. Core Value Proposition

| Output Stream | Target Audience | Primary Use Case | Output Format |
|---|---|---|---|
| **Human Insights** | Industrial Engineers, Operations Managers, Shop Floor Supervisors | Cycle-time reduction, bottleneck elimination, standard operating procedure (SOP) generation | Interactive timeline, step-by-step table, bottleneck alerts, time-saving metrics |
| **Robot Training Data** | Robotics Engineers, AI Researchers, Automation Specialists | Training imitation learning policies, VLA datasets, automated trajectory extraction | Standardized Atomic Action JSON, ROS 2 message compatible format, CSV trajectories |
| **Guepard Cloud** | Enterprise DevOps, Workflow Engineers | Version control, audit trail, cross-team collaboration, cloud backup | Cloud API payloads, version history diffs, dataset repository sync |

---

## 3. System Architecture & Free Model Pipeline

```
+---------------------------------------------------------------------------------+
|                               VIDEO INPUT ENGINE                                |
|  - Phone Video Upload (30-90s MP4/WebM/MOV) or Pre-loaded Industrial Benchmarks |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                       CLIENT-SIDE FRAME SAMPLING CANVAS                         |
|  - Downsampled keyframes (1-2 FPS) extracted directly in browser canvas        |
|  - Video chunk compression & base64 payload assembly                            |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                           FREE MODEL PROCESSING LAYER                           |
|  - Primary: NVIDIA Nemotron 3 through OpenRouter, using sampled frames |
|  - Fallback / Offline: Intelligent Client-side Motion & Heuristic Engine        |
|  - Structured Output Enforcement: Prompt with JSON Schema constraints            |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                          PHYSIOSKILL SYNTHESIS ENGINE                           |
|  +------------------------------------+  +------------------------------------+ |
|  |       HUMAN INSIGHTS PARSER        |  |     ROBOT DATA SCHEMA BUILDER      | |
|  | - Process Map & Step Durations     |  | - Atomic Primitives (pick/place)   | |
|  | - Bottleneck & Friction Detection  |  | - Spatial Bounding Boxes [ymin..]  | |
|  | - Lean Engineering Suggestions     |  | - Timestamps & Confidence Scores   | |
+--+------------------------------------+--+------------------------------------+--+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                     GUEPARD CLOUD VERSION CONTROL & UI HUB                      |
|  - Synchronized Bounding Box Video Player & Scrubber                            |
|  - Version Tree (v1.0 initial, v1.1 optimization diff)                          |
|  - JSON Export / ROS Connector / Guepard Cloud REST Sync                       |
+---------------------------------------------------------------------------------+
```

---

## 4. Technical Specifications & Data Schemas

### 4.1. Human Insights Schema (`HumanInsights`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "task_name": { "type": "string" },
    "total_duration_seconds": { "type": "number" },
    "efficiency_score": { "type": "number", "minimum": 0, "maximum": 100 },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "step_number": { "type": "integer" },
          "name": { "type": "string" },
          "start_time": { "type": "number" },
          "end_time": { "type": "number" },
          "duration": { "type": "number" },
          "category": { "type": "string", "enum": ["value_added", "non_value_added", "setup", "inspection", "idle"] },
          "summary": { "type": "string" }
        },
        "required": ["step_number", "name", "start_time", "end_time", "duration", "category"]
      }
    },
    "bottlenecks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "timestamp_range": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
          "impacted_step": { "type": "string" },
          "description": { "type": "string" },
          "root_cause": { "type": "string" }
        },
        "required": ["id", "timestamp_range", "severity", "impacted_step", "description"]
      }
    },
    "improvement_suggestions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "category": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "estimated_time_saved_sec": { "type": "number" }
        },
        "required": ["id", "category", "title", "description"]
      }
    }
  },
  "required": ["task_name", "total_duration_seconds", "steps", "bottlenecks", "improvement_suggestions"]
}
```

### 4.2. Robot Training Data Schema (`RobotTrainingData`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "dataset_id": { "type": "string" },
    "timestamp_iso": { "type": "string" },
    "task_type": { "type": "string" },
    "environment": { "type": "string" },
    "video_metadata": {
      "type": "object",
      "properties": {
        "fps": { "type": "number" },
        "resolution": { "type": "string" },
        "total_frames": { "type": "integer" }
      }
    },
    "atomic_actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action_id": { "type": "integer" },
          "primitive": {
            "type": "string",
            "enum": ["pick", "place", "move", "hold", "wait", "align", "press", "inspect", "release"]
          },
          "start_sec": { "type": "number" },
          "end_sec": { "type": "number" },
          "target_object": { "type": "string" },
          "secondary_object": { "type": "string" },
          "source_zone": { "type": "string" },
          "destination_zone": { "type": "string" },
          "bounding_box_normalized": {
            "type": "array",
            "items": { "type": "number" },
            "minItems": 4,
            "maxItems": 4,
            "description": "[ymin, xmin, ymax, xmax] normalized 0-1000 or 0-1"
          },
          "confidence_score": { "type": "number", "minimum": 0, "maximum": 1 },
          "grasp_type": { "type": "string" },
          "estimated_force": { "type": "string" }
        },
        "required": ["action_id", "primitive", "start_sec", "end_sec", "target_object", "bounding_box_normalized", "confidence_score"]
      }
    }
  },
  "required": ["dataset_id", "task_type", "atomic_actions"]
}
```

### 4.3. Guepard Cloud API Integration Schema (`GuepardCloudSnapshot`)

```json
{
  "project_id": "proj_physioskill_demo",
  "version": "1.0.0",
  "parent_version": null,
  "created_at": "2026-09-27T12:00:00Z",
  "metadata": {
    "video_filename": "assembly_task_bench.mp4",
    "analyzed_with": "Nemotron 3 via OpenRouter",
    "step_count": 5,
    "atomic_action_count": 8
  },
  "payload": {
    "human_insights": { "...": "..." },
    "robot_training_data": { "...": "..." }
  },
  "guepard_sync_status": "SYNCHRONIZED"
}
```

---

## 5. AI Provider Strategy & Implementation

The current process-analysis pipeline uses configured server-side providers:

1. **Nemotron 3 via OpenRouter**:
   - Browser extracts up to twelve timestamped frames and sends them to the local server API.
   - The local server makes the authenticated OpenRouter request and parses structured process steps and actions.

2. **Browser-based Frame Extraction Engine**:
   - Canvas-based sampling extracts frames at ~2 FPS directly in HTML5 `<canvas>`.
   - Sends lightweight frame arrays to Nemotron through OpenRouter.

3. **Zero-Latency Offline Intelligent Fallback Engine**:
   - Built directly into the application. If no internet or API key is present, a smart visual heuristic engine segments video duration into authentic physical task cycles with bounding boxes for instant zero-config testing.

---

## 6. Functional Requirements

### FR-1: Video Selection & Ingestion
- Support drag-and-drop file upload (`.mp4`, `.webm`, `.mov`) up to 100MB.
- Provide pre-loaded industrial sample benchmark videos:
  1. *Electronics PCB Assembly & Soldering*
  2. *Cardboard Box Packing & Taping*
  3. *Mechanical Component Sorting*
  4. *Power Tool Maintenance & Disassembly*

### FR-2: Physical Task Analysis Engine
- Perform dual-stream parsing: Human Operational Insights + Robot Manipulation Primitives.
- Calculate cycle times, value-add vs. non-value-add step classification.
- Detect idle waiting, searching, awkward reach angles, and repetitive motion bottlenecks.

### FR-3: Synchronized Bounding Box Video Player
- Render dynamic 2D bounding boxes and primitive label tags directly over the video stream synchronized with video timestamp (`currentTime`).
- Allow scrubbing through action timeline steps with instant seek.

### FR-4: Human Insights Dashboard
- Render step-by-step table with step category color badges (Value-Add, Non-Value-Add, Bottleneck).
- Display operational efficiency metrics (Cycle Time, Efficiency Score, Idle Time).
- Display actionable Lean & Ergonomic improvement cards with estimated time savings.

### FR-5: Robot Data Studio
- Display validated JSON structure with syntax highlighting and collapsible keys.
- Provide direct copy, JSON file download, ROS 2 Action Sequence export, and trajectory CSV export.

### FR-6: Guepard Cloud Sync & Versioning
- Allow saving current state as a versioned snapshot (`v1.0.0`, `v1.1.0`).
- Render version history timeline with change logs and snapshot comparison diff viewer.
- Simulate REST API handshake (`POST https://api.guepard.cloud/v1/physioskill/sync`).

---

## 7. Non-Functional Requirements & UX Guidelines

- **Aesthetics & UI**: Modern dark-mode aesthetic with glassmorphism, crisp typography (Inter/Outfit), high-contrast data visualization, vibrant accent colors (`emerald-500` for robot data, `indigo-500` for human insights, `amber-500` for bottlenecks).
- **Responsiveness**: Fully responsive desktop & tablet experience with tabbed/split view modes.
- **Performance**: Analysis time depends on clip length, network quality, and provider response time.
- **Privacy**: Video decoding and frame sampling happen in-browser; sampled frames are sent to the configured server-side analysis providers.

---

## 8. Success Metrics for MVP

1. **Insight Accuracy**: >90% step sequence coverage on 30–90s benchmark tasks.
2. **Robot Data Validity**: 100% adherence to the `RobotTrainingData` JSON schema.
3. **User Onboarding Time**: < 30 seconds from video load to interactive report review.
4. **Cost per Analysis**: Depends on the configured provider plans and usage.
