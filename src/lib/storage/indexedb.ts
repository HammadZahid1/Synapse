type IDBFactory = typeof indexedDB;

export interface StoredExperiment {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  networkConfig: unknown;
  trainingConfig: unknown;
  datasetConfig: unknown;
  metrics: unknown;
  status: string;
}

class IDBStorage {
  private dbName: string;
  private version: number;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string = 'Synapse', version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const indexedDB = (window as unknown as { indexedDB?: IDBFactory }).indexedDB;
      if (!indexedDB) {
        reject(new Error('IndexedDB is not available'));
        return;
      }
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (_event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains('experiments')) {
          db.createObjectStore('experiments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
    return this.dbPromise;
  }

  async getExperiments(): Promise<StoredExperiment[]> {
    const db = await this.getDB();
    const tx = db.transaction('experiments', 'readonly');
    const store = tx.objectStore('experiments');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async putExperiment(experiment: StoredExperiment): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('experiments', 'readwrite');
    const store = tx.objectStore('experiments');
    const request = store.put(experiment);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExperiment(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('experiments', 'readwrite');
    const store = tx.objectStore('experiments');
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExperiments(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('experiments', 'readwrite');
    const store = tx.objectStore('experiments');
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPreference<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    const tx = db.transaction('preferences', 'readonly');
    const store = tx.objectStore('preferences');
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as { value?: T } | undefined)?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async setPreference<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    const request = store.put({ key, value });
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removePreference(key: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    const request = store.delete(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getDB();
      return true;
    } catch {
      return false;
    }
  }
}

export const idbStorage = new IDBStorage();
