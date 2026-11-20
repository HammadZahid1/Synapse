import { create } from 'zustand';
import { idbStorage } from '@/lib/storage/indexedb';
import { type StoredExperiment } from '@/lib/storage/indexedb';

export interface Experiment {
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

function now(): number {
  return Date.now();
}

function makeExperiment(partial: Partial<Experiment>): Experiment {
  const time = now();
  return {
    id: partial.id || `exp-${time}-${Math.random().toString(36).slice(2, 8)}`,
    name: partial.name || 'Untitled experiment',
    createdAt: partial.createdAt ?? time,
    updatedAt: time,
    networkConfig: partial.networkConfig ?? null,
    trainingConfig: partial.trainingConfig ?? null,
    datasetConfig: partial.datasetConfig ?? null,
    metrics: partial.metrics ?? null,
    status: partial.status ?? 'idle',
  };
}

interface ExperimentState {
  experiments: Experiment[];
  loading: boolean;
  error: string | null;

  fetchExperiments: () => Promise<void>;
  createExperiment: (name: string) => Promise<Experiment>;
  getExperiment: (id: string) => Experiment | undefined;
  updateExperiment: (id: string, patch: Partial<Experiment>) => Promise<void>;
  duplicateExperiment: (id: string) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
  saveMetrics: (id: string, metrics: unknown, status: string) => Promise<void>;
  setDatasetConfig: (id: string, config: unknown) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  experiments: [],
  loading: false,
  error: null,

  fetchExperiments: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await idbStorage.getExperiments();
      const experiments = rows.sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ) as unknown as Experiment[];
      set({ experiments, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load experiments',
        loading: false,
      });
    }
  },

  createExperiment: async (name) => {
    const experiment = makeExperiment({ name });
    await idbStorage.putExperiment(experiment as unknown as StoredExperiment);
    set({ experiments: [experiment, ...get().experiments] });
    return experiment;
  },

  getExperiment: (id) => get().experiments.find((e) => e.id === id),

  updateExperiment: async (id, patch) => {
    const experiment = get().getExperiment(id);
    if (!experiment) return;
    const next = { ...experiment, ...patch, updatedAt: now() };
    await idbStorage.putExperiment(next as unknown as StoredExperiment);
    set({
      experiments: get().experiments.map((e) => (e.id === id ? next : e)),
    });
  },

  duplicateExperiment: async (id) => {
    const experiment = get().getExperiment(id);
    if (!experiment) return;
    const copy = makeExperiment({
      ...experiment,
      id: undefined,
      name: `${experiment.name} (copy)`,
      createdAt: now(),
      updatedAt: now(),
    });
    await idbStorage.putExperiment(copy as unknown as StoredExperiment);
    set({ experiments: [copy, ...get().experiments] });
  },

  deleteExperiment: async (id) => {
    await idbStorage.deleteExperiment(id);
    set({ experiments: get().experiments.filter((e) => e.id !== id) });
  },

  saveMetrics: async (id, metrics, status) => {
    const experiment = get().getExperiment(id);
    if (!experiment) return;
    await get().updateExperiment(id, { metrics, status });
  },

  setDatasetConfig: async (id, config) => {
    await get().updateExperiment(id, { datasetConfig: config });
  },

  clearAll: async () => {
    await idbStorage.clearExperiments();
    set({ experiments: [] });
  },
}));
