# PhysioSkill

PhysioSkill is an intelligent physical-task analytics platform that transforms standard workplace video footage into dual-stream structured outputs: Lean and ergonomic operational insights for human teams, and schema-validated atomic manipulation trajectories for robotics training.

The system processes video from mobile devices or industrial cameras without requiring dedicated depth sensors or proprietary motion-capture hardware.

---

## Table of Contents

- Overview
- Core Value Proposition
- Architecture and Processing Pipeline
- Key Features
- Technology Stack
- Repository Structure
- Getting Started
  - Prerequisites
  - Installation
  - Environment Configuration
  - Running Locally
  - Production Build
- AI and Tool Disclosure
  - Stack Selection and Rationale
  - Security, Access Constraints, and Secrets Handling
  - Brev Cloud Usage Disclosure
  - AI Inside the Product
    - Models and Functional Roles
    - Input to Action to Output Example
    - Identification of Simulated Outputs and Fallbacks
  - AI Used to Help Build the Project
    - Engineering Assistants Used
    - Human Review, Adjustments, and Verifications
  - Datasets, APIs, and Asset Inventory
- Data Schemas and Export Formats
- License

---

## Overview

Industrial operations and robotic automation share a fundamental bottleneck: capturing, understanding, and structuring physical human labor. Traditional time-and-motion studies require manual observation, while robotics imitation learning typically demands expensive teleoperation rigs or instrumented kinematic suits.

PhysioSkill bridges this gap. By combining client-side video decoding with vision-language models and formal reasoning systems, PhysioSkill extracts:

1. Operational Human Insights: Cycle-time metrics, value-added versus non-value-added breakdown, bottleneck identification with root-cause diagnoses, and Lean improvement suggestions.
2. Robot Training Data: Normalized 2D spatial bounding boxes, atomic manipulation primitives (pick, place, align, hold, inspect), qualitative grasp and force cues, scene-graph relational graphs, demonstration outcome classifications, and observed recovery maneuvers.
3. Versioned Workflow Management: Snapshot tracking, diff comparisons, and Guepard Cloud REST synchronization simulation for cross-team deployment.

---

## Core Value Proposition

| Dimension | Human Operations (Lean / Industrial Engineering) | Robotics and Automation Engineering |
|---|---|---|
| Primary Users | Process Engineers, Plant Managers, Ergonomists | Robotics Researchers, VLA Developers, Automation Teams |
| Input Data | Handheld smartphone or stationary workstation video (30-90 seconds) | The same unstructured monocular RGB video |
| Output Format | Process timelines, step categorization badges, bottleneck diagnostics | Schema-valid JSON, ROS 2 action format, trajectory CSV |
| Operational Impact | Eliminates manual stopwatch audits and highlights waste | Generates structured demonstration priors for imitation learning |
| Infrastructure | Zero hardware investment; runs in modern web browsers | Avoids teleoperation suits and dedicated motion capture rigs |

---

## Architecture and Processing Pipeline

```
+---------------------------------------------------------------------------------+
|                               VIDEO INGESTION LAYER                             |
|  - User File Upload (MP4, MOV, WebM up to 100MB) or Industrial Benchmark Clips  |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                        IN-BROWSER FRAME EXTRACTION ENGINE                       |
|  - HTML5 Canvas decodes video metadata and samples 2-8 keyframes (max 768px)    |
|  - Formats temporal keyframes with timestamp metadata for payload transmission  |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                          SERVER-SIDE ANALYSIS PIPELINE                          |
|  - Embedded Vite HTTP Middleware (/api/analyze) with Server-Sent Events (SSE)   |
|  - Primary Vision: NVIDIA Nemotron 3 via OpenRouter                             |
|  - Process Verification: TypeSafe Jev (System One API)                          |
|  - Report Synthesis: OpenRouter Free / Synthesis Model                          |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                            DUAL-STREAM SYNTHESIS ENGINE                         |
|  +------------------------------------+  +------------------------------------+ |
|  |        HUMAN INSIGHTS STREAM       |  |         ROBOT DATA STREAM          | |
|  | - Process map & step intervals     |  | - Atomic primitives & boundaries   | |
|  | - Value-add vs non-value-add tags  |  | - Normalized 0-1000 2D coordinates | |
|  | - Bottleneck severity and causes   |  | - Scene graph & recovery events    | |
|  | - Quantified time-saving proposals |  | - Grasp and contact observations   | |
|  +------------------------------------+  +------------------------------------+ |
+---------------------------------------+-----------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                        PERSISTENCE AND VISUALIZATION HUB                        |
|  - Synchronized bounding-box video scrubber and coordinate overlay              |
|  - Client-side IndexedDB history storage (AnalysisHistory)                      |
|  - Guepard Cloud version tracking and snapshot diff viewer                      |
|  - Multi-format exporter: JSON, ROS 2 action sequences, trajectory CSV          |
+---------------------------------------------------------------------------------+
```

---

## Key Features

- Client-Side Frame Sampling: Video files are decoded directly in the client browser using standard HTML5 Canvas primitives. Only sparse downsampled frames are transmitted for inference, preserving bandwidth and protecting data privacy.
- Real-Time Progress Streaming: The analysis backend uses Server-Sent Events (SSE) to stream live progress indicators to the user interface, tracking extraction, visual recognition, verification, and report synthesis.
- Synchronized Visual Scrubber: A synchronized canvas overlays detected 2D bounding boxes and primitive tags directly over the HTML5 video player, updating dynamically as the video plays or when scrubbed.
- Dual Operational Dashboards:
  - Human Insights Dashboard: Color-coded operational step cards, efficiency percentage scores, idle-time indicators, and expandable Lean recommendations with estimated seconds saved.
  - Robot Data Studio: Formatted JSON tree viewer, copy utilities, atomic primitive filters, and download capabilities for ROS 2 action schemas and trajectory CSV tables.
- Version Control and Guepard Cloud Synchronization: Stores immutable analysis snapshots, displays structured visual diffs between revisions, and simulates REST synchronization against cloud endpoints.
- Secure Local Storage: Historical analyses, attached video references, and user modifications are stored locally in the browser via IndexedDB.

---

## Technology Stack

- Application Framework: React 19, TypeScript
- Build Tool and Dev Server: Vite 8 with custom Node.js middleware plugin
- Styling: Tailwind CSS v4, Base UI, Class Variance Authority, Tailwind Merge
- Icons and UI Components: Lucide React, Radix UI Slot
- Animation and Feedback: Canvas Confetti
- Local Persistence: Browser IndexedDB API via custom `AnalysisHistory` abstraction
- Multimodal Inference Providers: OpenRouter (NVIDIA Nemotron 3, Report LLM) and TypeSafe AI (Jev System One)

---

## Repository Structure

```
.
├── .env.example              # Template for server-side API keys
├── .gitignore                # Git exclusion rules (ignores *.local, node_modules, dist)
├── .oxlintrc.json            # Fast linter configuration
├── components.json           # Component configuration
├── index.html                # Single-page application entry point
├── package.json              # Dependency declarations and scripts
├── public/                   # Static public assets
├── server/
│   └── analysisApi.ts        # Vite middleware implementing /api/analyze SSE route
├── src/
│   ├── App.css               # Application-level styles
│   ├── App.tsx               # Primary application view and state management
│   ├── assets/               # Local asset files
│   ├── components/           # UI components
│   │   ├── landing/          # Landing page sections (Hero, Navigation, Process, Footer)
│   │   ├── ui/               # Base UI primitive components (Button, Card, Input)
│   │   ├── GuepardCloudView.tsx  # Cloud snapshot and version diff manager
│   │   ├── HumanInsightsView.tsx # Lean metrics, process steps, and recommendations
│   │   ├── Navbar.tsx            # Header navigation and status bar
│   │   ├── PrdViewer.tsx         # In-app product specification viewer
│   │   ├── RobotDataView.tsx     # Robotics JSON viewer, filters, and exporter
│   │   ├── VideoCanvasPlayer.tsx # Synchronized bounding-box video scrubber
│   │   └── VideoSelector.tsx     # File uploader and benchmark selector
│   ├── data/
│   │   └── benchmarks.ts     # Pre-configured industrial benchmark datasets
│   ├── hooks/                # Reusable custom React hooks
│   ├── lib/                  # Utility functions
│   ├── services/
│   │   ├── aiAnalyzer.ts     # Client service coordinating frame sampling and API calls
│   │   └── storage.ts        # IndexedDB wrapper for local analysis persistence
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces for schemas, steps, and actions
│   └── utils/                # Coordinate normalization and export helpers
├── tsconfig.app.json         # TypeScript compiler configuration for application
├── tsconfig.json             # Root TypeScript project references
├── tsconfig.node.json        # TypeScript configuration for server and Vite
└── vite.config.ts            # Vite build configuration and plugin registration
```

---

## Getting Started

### Prerequisites

- Node.js version 18.0.0 or higher
- npm (Node Package Manager) version 9.0.0 or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Malekse21/PhysioSkill.git
cd PhysioSkill
npm install
```

### Environment Configuration

The backend analysis pipeline requires an OpenRouter API key. An API key for TypeSafe Jev is optional for secondary confidence scoring.

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` in an editor and insert your keys:

```ini
OPENROUTER_API_KEY=your_openrouter_api_key_here
TYPESAFE_API_KEY=your_typesafe_api_key_here
```

Keys are consumed strictly on the server side by the local Vite middleware (`server/analysisApi.ts`). They are never exposed as `VITE_*` environment variables in client-side browser bundles.

### Running Locally

Start the local development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Production Build

To compile and validate the TypeScript codebase and produce an optimized production bundle:

```bash
npm run build
```

To preview the production bundle locally:

```bash
npm run preview
```

---

## AI and Tool Disclosure

### Stack Selection and Rationale

PhysioSkill was engineered to make physical process intelligence accessible on standard consumer hardware without requiring dedicated multi-GPU workstations or local model hosting.

1. Remote Multimodal LLM: NVIDIA Nemotron 3 via OpenRouter was selected because it combines multimodal vision comprehension with structured JSON tool-calling capabilities. This allows the system to receive sparse image frames and output strict schema-compliant action primitives.
2. Secondary Verification Agent: TypeSafe Jev was chosen to evaluate process step labels against visual summaries independently, ensuring that categorization decisions are checked and given an explicit evidence score.
3. Embedded Vite Middleware: Rather than standing up a separate Python or Go microservice for an MVP, the server logic is integrated directly into Vite via Node.js HTTP middleware. This keeps local development single-process while preventing API keys from being leaked to browser memory.

### Security, Access Constraints, and Secrets Handling

- No API keys, passwords, or authentication secrets are stored in version control.
- The `.gitignore` file strictly excludes `.env.local` and any `*.local` variants.
- Both the client service (`src/services/aiAnalyzer.ts`) and the server middleware (`server/analysisApi.ts`) implement strict regex redactors (`safeClientError` and `safeLogText`) that strip Bearer headers and common API key patterns (`sk-or-v1-`, `gsk_`, `AIza`) before printing any error or console message.
- User video files are decoded in-browser and stored exclusively in local IndexedDB. Video binaries are never sent to external third-party storage without explicit consent.

### Brev Cloud Usage Disclosure

Brev was not used for this project. All model inference is performed via serverless external API endpoints (OpenRouter and TypeSafe AI), while frontend and middleware execution runs locally in Node.js and standard modern browsers.

---

### AI Inside the Product

#### Models and Functional Roles

1. NVIDIA Nemotron 3 Nano Omni (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` via OpenRouter)
   - Role: Multimodal video sequence interpreter.
   - Utility: Analyzes sparse chronological video keyframes sampled from user uploads. Extracts discrete temporal steps, classifies atomic physical actions (such as pick, place, align, hold), estimates 2D bounding boxes in normalized image coordinates (0-1000 scale), documents object interactions, and flags recovery actions.
2. TypeSafe Jev (`jev-latest` via TypeSafe AI System One API)
   - Role: Analytical verification and confidence scoring.
   - Utility: Takes observed step names and descriptions as structured state, classifies each step into standardized Lean categories (`setup`, `value_added`, `non_value_added`, `inspection`, `idle`), and assigns an evidence score (0-2 scale) to highlight uncertain events that require human verification.
3. OpenRouter Free / Synthesis Model (`openrouter/free` via OpenRouter)
   - Role: Executive report generator.
   - Utility: Synthesizes detected timeline steps and bottlenecks into an executive summary, diagnoses root causes, proposes actionable Lean/ergonomic improvements, and calculates estimated cycle-time savings.

#### Input to Action to Output Example

- Input:
  - Video Clip: `carton_packing_station.mp4` (Duration: 24.0 seconds).
  - User Task Hint: "Box assembly and tape sealing".
  - Sampled Frames: 6 normalized JPEG frames extracted at timestamps 0.0s, 4.8s, 9.6s, 14.4s, 19.2s, 24.0s.
- AI Action:
  1. Nemotron 3 identifies visible items (cardboard blank, tape dispenser, packing table), partitions the 24.0-second timeline into 4 chronological steps, and details 6 atomic manipulation primitives.
  2. TypeSafe Jev evaluates the 4 steps, classifying flap folding and taping as `value_added` (score: 1.9) and a 5-second pause searching for tape as `non_value_added` (score: 1.6, flagged for review).
  3. The synthesis model aggregates the data, identifying the tape search as a medium-severity bottleneck caused by poor workstation layout.
- Output:
  - Human Insights Stream: 4-step sequence showing 15.2s value-added time (63% efficiency score), a 5.0s non-value-added bottleneck, and an actionable suggestion: "Mount tape dispenser on an overhead gravity balancer; estimated time saved: 4.5 seconds".
  - Robot Training Data Stream: Schema-validated JSON containing atomic actions including:
    ```json
    {
      "action_id": 2,
      "primitive": "pick",
      "start_sec": 8.2,
      "end_sec": 10.5,
      "target_object": "handheld tape dispenser",
      "bounding_box_normalized": [320, 540, 580, 810],
      "confidence_score": 0.89,
      "grasp_type": "power grip",
      "suggested_gripper": "parallel"
    }
    ```

#### Identification of Simulated Outputs and Fallbacks

To ensure reliable demonstration and evaluation without requiring live API access:

1. Benchmark Presets: Four pre-loaded industrial benchmarks (PCB Assembly, Carton Packing, Mechanical Sorting, Power Tool Maintenance) located in `src/data/benchmarks.ts` contain curated, pre-verified ground-truth datasets. These benchmarks run entirely offline without calling external APIs.
2. Graceful Degradation: If TypeSafe Jev is unavailable or unconfigured, the application fulfills the visual analysis using Nemotron alone and displays a notice that confidence verification was skipped. If the report synthesis model encounters rate limits, raw step data remains available to the user.
3. Guepard Cloud Sync: The cloud synchronization handshake in `src/components/GuepardCloudView.tsx` simulates the REST transaction (`POST https://api.guepard.cloud/v1/physioskill/sync`), verifying payload construction and updating local status to `SYNCHRONIZED` without sending data to an unauthenticated external server.

---

### AI Used to Help Build the Project

#### Engineering Assistants Used

- Antigravity / Gemini Advanced Coding Assistant: Utilized as an interactive pair-programming and code generation assistant for rapid prototyping, TypeScript schema modeling, CSS design, and component architecture.

#### Human Review, Adjustments, and Verifications

The development team manually checked, tested, and modified all AI-assisted outputs:

1. Coordinate Space Integrity: The assistant initially generated unbounded bounding box representations. The team strictly refactored the schemas and prompts to enforce normalized 2D image coordinates (0 to 1000) and explicitly prohibited the model from hallucinating 3D metric distances or joint angles from monocular video lacking depth calibration.
2. Security and Error Redaction: The team reviewed all client and server error handling routines to guarantee that provider error bodies could never print raw API keys or Authorization headers to browser consoles or client error alerts.
3. Frame Sampling Efficiency: The team tuned the client-side frame sampling algorithm in `src/services/aiAnalyzer.ts` to limit video captures to between 2 and 8 evenly spaced frames. This kept the OpenRouter payload size well under the 50MB HTTP limit and reduced token latency.
4. Privacy and Persistence Architecture: The team rejected designs requiring cloud database storage for user video uploads, implementing an in-browser IndexedDB repository (`AnalysisHistory`) to guarantee that user videos remain on the user's device.
5. Removal of Hallucinated Tools: The team verified that prompts instruct the vision model to record grasp types and forces only as observed qualitative visual evidence (such as material deformation or two-finger pinch) rather than uncalibrated metric force values.

---

### Datasets, APIs, and Asset Inventory

| Asset / Service | Type | Source / Provider | Access Constraints | Fallback Strategy |
|---|---|---|---|---|
| OpenRouter API | API | OpenRouter (`openrouter.ai`) | Requires API Key; subject to upstream provider rate limits | Offline benchmark presets in `src/data/benchmarks.ts` |
| NVIDIA Nemotron 3 | Model | NVIDIA via OpenRouter | Subject to free tier concurrency limits | Pre-computed benchmark demonstrations |
| TypeSafe Jev | API / Model | TypeSafe AI (`api.typesafe.ai`) | Requires TypeSafe API Key | Graceful bypass; steps display with unverified notice |
| Industrial Video Benchmarks | Media Assets | Public web storage / Unsplash posters | Public open access | Local file drag-and-drop supporting user MP4/WebM files |
| Interface Icons | Asset Library | Lucide React (`lucide-react`) | Open source (ISC License) | Bundled with application dependencies |
| UI Component Primitives | Code Library | Base UI / Radix UI | Open source (MIT License) | Standard HTML5 UI elements |

---

## Data Schemas and Export Formats

PhysioSkill exports three primary data formats from every analyzed video:

1. Human Insights Report (`JSON`):
   - Executive summary
   - Chronological step breakdown with start/end timestamps and duration
   - Category tags (`setup`, `value_added`, `non_value_added`, `inspection`, `idle`)
   - Bottlenecks with severity ratings (`low`, `medium`, `high`, `critical`) and root causes
   - Improvement recommendations with estimated time savings
2. Robot Training Trajectory (`JSON`):
   - Dataset identification and ISO timestamp
   - Video metadata (fps, resolution, total frames)
   - Atomic manipulation actions (primitive, duration, target object, normalized bounding box, confidence)
   - Qualitative contact information (grasp type, candidate gripper, force cues)
   - Dynamic 2D scene graph (detected objects and relational predicates over time)
   - Demonstration outcome (`successful`, `recovery_observed`, `incomplete_or_failed`, `unclear`)
3. Interoperability Formats:
   - ROS 2 Action Sequence JSON: Formatted for direct loading into robotic task controllers.
   - Trajectory CSV: Tabular row-per-action format for statistical analysis and trajectory plotting.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
