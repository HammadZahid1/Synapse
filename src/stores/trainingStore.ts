import { create } from 'zustand';
import {
  TrainingEngine,
  type TrainingConfig,
  type Dataset,
  type EpochMetrics,
} from '@/lib/ml/training';
import { useNetworkStore } from './networkStore';

export type TrainingStatus = 'idle' | 'training' | 'paused' | 'stopped' | 'completed';

export interface TrainingState {
  status: TrainingStatus;
  history: EpochMetrics[];
  currentEpoch: number;
  loss: number | null;
  validationLoss: number | null;
  accuracy: number | null;
  durationMs: number;
  engine: TrainingEngine | null;

  startTraining: (
    dataset: Dataset,
    config?: Partial<TrainingConfig>,
  ) => Promise<void>;
  pauseTraining: () => void;
  resumeTraining: () => void;
  stopTraining: () => void;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  status: 'idle',
  history: [],
  currentEpoch: 0,
  loss: null,
  validationLoss: null,
  accuracy: null,
  durationMs: 0,
  engine: null,

  startTraining: async (dataset, config) => {
    const network = useNetworkStore.getState().network;
    if (!network) throw new Error('Network not initialized');

    if (get().status === 'training') {
      throw new Error('Training already in progress');
    }

    const engine = new TrainingEngine();
    set({ engine });
    const resolved = {
      epochs: 100,
      learningRate: 0.1,
      batchSize: 1,
      optimizer: 'sgd',
      loss: 'mse',
      validationSplit: 0.2,
      shuffle: true,
      ...config,
    };

    set({
      status: 'training',
      history: [],
      currentEpoch: 0,
      loss: null,
      validationLoss: null,
      accuracy: null,
      durationMs: 0,
    });

    try {
      const result = await engine.train(network, dataset, resolved, {
        onEpoch: (metrics) => {
          set({
            history: [...get().history, metrics],
            currentEpoch: metrics.epoch,
            loss: metrics.loss,
            validationLoss: metrics.validationLoss,
            accuracy: metrics.accuracy,
            durationMs: metrics.durationMs,
          });
        },
      });
      if (get().engine === engine) {
        set({ status: result.status, engine: null });
      }
    } catch {
      if (get().engine === engine) {
        set({ status: 'idle', engine: null });
      }
    }
  },

  pauseTraining: () => {
    const engine = get().engine;
    if (engine) engine.pause();
    set({ status: 'paused' });
  },

  resumeTraining: () => {
    const engine = get().engine;
    if (engine) {
      engine.resume();
      set({ status: 'training' });
    }
  },

  stopTraining: () => {
    const engine = get().engine;
    if (engine) engine.stop();
    set({ status: 'stopped', engine: null });
  },

  resetTraining: () => {
    const engine = get().engine;
    if (engine) engine.stop();
    set({
      status: 'idle',
      history: [],
      currentEpoch: 0,
      loss: null,
      validationLoss: null,
      accuracy: null,
      durationMs: 0,
      engine: null,
    });
  },
}));
