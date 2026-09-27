export type StepCategory = 'value_added' | 'non_value_added' | 'setup' | 'inspection' | 'idle';

export interface HumanInsightStep {
  step_number: number;
  name: string;
  start_time: number;
  end_time: number;
  duration: number;
  category: StepCategory;
  summary: string;
  evidence_score?: number;
  needs_review?: boolean;
}

export interface Bottleneck {
  id: string;
  timestamp_range: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impacted_step: string;
  description: string;
  root_cause: string;
}

export interface ImprovementSuggestion {
  id: string;
  category: string;
  title: string;
  description: string;
  estimated_time_saved_sec: number;
}

export interface HumanInsightsData {
  task_name: string;
  total_duration_seconds: number;
  efficiency_score: number;
  steps: HumanInsightStep[];
  bottlenecks: Bottleneck[];
  improvement_suggestions: ImprovementSuggestion[];
  analysis_summary?: string;
  follow_up_questions?: string[];
  analysis_warnings?: string[];
}

export type AtomicPrimitive = 
  | 'pick' 
  | 'place' 
  | 'move' 
  | 'hold' 
  | 'wait' 
  | 'align' 
  | 'press' 
  | 'inspect' 
  | 'release';

export interface AtomicAction {
  action_id: number;
  primitive: AtomicPrimitive;
  start_sec: number;
  end_sec: number;
  target_object: string;
  secondary_object?: string;
  source_zone?: string;
  destination_zone?: string;
  bounding_box_normalized: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  confidence_score: number;
  grasp_type?: string;
  suggested_gripper?: string;
  estimated_force?: string;
  force_evidence?: string;
  approach_angle_deg?: number;
  object_center_normalized?: [number, number];
  object_size_normalized?: [number, number];
}

export interface RobotSceneObject {
  object_id: string;
  label: string;
  first_seen_sec: number;
  last_seen_sec: number;
  center_normalized?: [number, number];
  bounding_box_normalized?: [number, number, number, number];
  confidence_score: number;
}

export interface RobotSpatialRelation {
  source_object: string;
  target_object: string;
  relation: string;
  start_sec: number;
  end_sec: number;
  confidence_score: number;
}

export interface RobotRecoveryEvent {
  timestamp_sec: number;
  issue: string;
  response: string;
  result: string;
  confidence_score: number;
}

export type DemonstrationOutcome = 'successful' | 'recovery_observed' | 'incomplete_or_failed' | 'unclear';

export interface RobotTrainingData {
  dataset_id: string;
  timestamp_iso: string;
  task_type: string;
  environment: string;
  video_metadata: {
    fps: number;
    resolution: string;
    total_frames: number;
  };
  atomic_actions: AtomicAction[];
  scene_graph?: {
    coordinate_frame: 'image_2d_normalized';
    objects: RobotSceneObject[];
    relations: RobotSpatialRelation[];
  };
  demonstration_outcome?: DemonstrationOutcome;
  outcome_evidence?: string;
  recovery_events?: RobotRecoveryEvent[];
}

export interface GuepardVersion {
  version: string;
  created_at: string;
  commit_message: string;
  human_insights: HumanInsightsData;
  robot_data: RobotTrainingData;
  sync_status: 'synced' | 'pending' | 'saving';
}

export interface AnalysisResult {
  human_insights: HumanInsightsData;
  robot_data: RobotTrainingData;
}

export interface StepReview {
  status: 'confirmed' | 'needs_edit';
  editedName: string;
  note: string;
}

export interface SavedAnalysis {
  id: string;
  name: string;
  createdAt: string;
  duration: number;
  result: AnalysisResult;
  video?: Blob;
  reviews: Record<string, StepReview>;
}

export interface BenchmarkPreset {
  id: string;
  title: string;
  industry: string;
  description: string;
  duration_sec: number;
  video_url: string;
  poster: string;
  data: AnalysisResult;
}
