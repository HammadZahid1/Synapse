export interface Settings {
  appearance: {
    theme: 'dark';
    accent: 'cyan' | 'violet' | 'indigo';
  };
  animation: {
    enabled: boolean;
    reducedMotion: boolean;
  };
  visualization: {
    showActivations: boolean;
    showWeights: boolean;
    signalSpeed: number;
  };
  training: {
    defaultEpochs: number;
    defaultLearningRate: number;
    defaultBatchSize: number;
    defaultValidationSplit: number;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: { theme: 'dark', accent: 'cyan' },
  animation: { enabled: true, reducedMotion: false },
  visualization: { showActivations: true, showWeights: true, signalSpeed: 1 },
  training: {
    defaultEpochs: 100,
    defaultLearningRate: 0.1,
    defaultBatchSize: 1,
    defaultValidationSplit: 0.2,
  },
};

interface SettingsState {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch } as Settings;
    set({ settings });
  },

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  exportSettings: () => JSON.stringify(get().settings, null, 2),

  importSettings: (json) => {
    try {
      const parsed = JSON.parse(json);
      const settings = { ...DEFAULT_SETTINGS, ...parsed } as Settings;
      set({ settings });
      return true;
    } catch {
      return false;
    }
  },
}));
