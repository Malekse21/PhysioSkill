import type { GuepardVersion, AnalysisResult } from '../types';

const STORAGE_KEY = 'physioskill_guepard_versions_v1';

export class GuepardCloudService {
  /**
   * Initializes or fetches all Guepard Cloud versions
   */
  public static getVersions(currentData?: AnalysisResult): GuepardVersion[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse saved Guepard versions:', e);
      }
    }

    // Default baseline version if none saved yet
    if (currentData) {
      const initialVersion: GuepardVersion = {
        version: 'v1.0.0',
        created_at: new Date().toISOString(),
        commit_message: 'Baseline initial analysis upload from phone video',
        human_insights: currentData.human_insights,
        robot_data: currentData.robot_data,
        sync_status: 'synced'
      };
      this.saveVersions([initialVersion]);
      return [initialVersion];
    }

    return [];
  }

  /**
   * Saves a new version snapshot to Guepard Cloud
   */
  public static async createVersionSnapshot(
    analysisData: AnalysisResult,
    commitMessage: string,
    onSyncStatus?: (status: 'saving' | 'synced') => void
  ): Promise<GuepardVersion> {
    if (onSyncStatus) onSyncStatus('saving');
    
    // Simulate Guepard Cloud REST API call latency
    await new Promise((res) => setTimeout(res, 1200));

    const existing = this.getVersions();
    const nextVersionNum = existing.length + 1;
    const versionTag = `v1.${nextVersionNum - 1}.0`;

    const newVersion: GuepardVersion = {
      version: versionTag,
      created_at: new Date().toISOString(),
      commit_message: commitMessage || `Optimization iteration ${versionTag}`,
      human_insights: JSON.parse(JSON.stringify(analysisData.human_insights)),
      robot_data: JSON.parse(JSON.stringify(analysisData.robot_data)),
      sync_status: 'synced'
    };

    const updatedList = [newVersion, ...existing];
    this.saveVersions(updatedList);

    if (onSyncStatus) onSyncStatus('synced');
    return newVersion;
  }

  /**
   * Simulates REST API sync payload to Guepard Cloud
   */
  public static async syncToGuepardAPI(
    version: GuepardVersion,
    apiEndpoint: string = 'https://api.guepard.cloud/v1/projects/physioskill/sync'
  ): Promise<{ success: boolean; message: string; timestamp: string }> {
    await new Promise((res) => setTimeout(res, 1000));
    return {
      success: true,
      message: `Successfully pushed snapshot ${version.version} to ${apiEndpoint}`,
      timestamp: new Date().toISOString()
    };
  }

  private static saveVersions(versions: GuepardVersion[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  }
}
