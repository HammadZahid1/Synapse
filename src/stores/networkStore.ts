import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  NeuralNetwork,
  createDefaultConfig,
  type NetworkConfig,
} from '@/lib/ml/network';

export interface NetworkState {
  config: NetworkConfig;
  network: NeuralNetwork | null;
  isInitialized: boolean;

  initializeNetwork: () => void;
  updateConfig: (patch: Partial<NetworkConfig>) => void;
  setHiddenLayers: (layers: Array<{ size: number; activation: string }>) => void;
  setInputSize: (size: number) => void;
  setOutputSize: (size: number) => void;
  setOutputActivation: (activation: string) => void;
  setWeightInit: (init: string) => void;
  randomize: () => void;
  loadPreset: (config: NetworkConfig) => void;
  reset: () => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      config: createDefaultConfig(),
      network: null,
      isInitialized: false,

      initializeNetwork: () => {
        const { config } = get();
        set({ network: new NeuralNetwork(config), isInitialized: true });
      },

      updateConfig: (patch) => {
        const config = { ...get().config, ...patch };
        set({ config });
        get().initializeNetwork();
      },

      setHiddenLayers: (layers) => {
        get().updateConfig({ hiddenLayers: layers as never });
      },

      setInputSize: (size) => {
        get().updateConfig({ inputSize: size });
      },

      setOutputSize: (size) => {
        get().updateConfig({ outputSize: size });
      },

      setOutputActivation: (activation) => {
        get().updateConfig({ outputActivation: activation as never });
      },

      setWeightInit: (init) => {
        get().updateConfig({ weightInit: init as never });
      },

      randomize: () => {
        const { network } = get();
        if (!network) return;
        // Reinitialize with same config to randomize weights
        get().initializeNetwork();
      },

      loadPreset: (config) => {
        set({ config, isInitialized: false });
        get().initializeNetwork();
      },

      reset: () => {
        const defaultConfig = createDefaultConfig();
        set({ config: defaultConfig, isInitialized: false });
        get().initializeNetwork();
      },
    }),
    { name: 'synapse-network', partialize: (state) => ({ config: state.config }) },
  ),
);
