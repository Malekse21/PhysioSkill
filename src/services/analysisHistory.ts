import type { AnalysisResult, SavedAnalysis } from '../types';

const DATABASE = 'physioskill-history';
const STORE = 'analyses';
const VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open saved analyses.'));
  });
}

async function runRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not update saved analyses.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Could not update saved analyses.')); };
  });
}

export const AnalysisHistory = {
  list: () => runRequest<SavedAnalysis[]>('readonly', store => store.getAll()),
  get: (id: string) => runRequest<SavedAnalysis | undefined>('readonly', store => store.get(id)),
  save: (record: SavedAnalysis) => runRequest<IDBValidKey>('readwrite', store => store.put(record)),
  remove: (id: string) => runRequest<undefined>('readwrite', store => store.delete(id)),
  create(name: string, duration: number, result: AnalysisResult, video: Blob | undefined, processLabel?: string): SavedAnalysis {
    return { id: crypto.randomUUID(), name, processLabel, createdAt: new Date().toISOString(), duration, result, video, reviews: {} };
  },
};
