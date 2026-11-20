import {
  Matrix,
  columnVector,
  flatten,
  copy,
} from '@/lib/math/matrix';
import { DenseLayer, createDenseLayer, denseForward, DenseLayerConfig } from './dense';
import {
  ActivationName,
  getActivation,
  activationInfo,
  allActivationNames,
} from './activations';

export interface NetworkConfig {
  inputSize: number;
  outputSize: number;
  hiddenLayers: Array<{ size: number; activation: ActivationName }>;
  outputActivation: ActivationName;
  weightInit: 'xavier' | 'he' | 'random' | 'zeros';
}

export interface ForwardResult {
  output: number[];
  layerOutputs: Matrix[];
  layerInputs: Matrix[];
}

export class NeuralNetwork {
  readonly inputSize: number;
  readonly outputSize: number;
  private layers: DenseLayer[];
  private weightInit: 'xavier' | 'he' | 'random' | 'zeros';

  constructor(config: NetworkConfig) {
    this.validateConfig(config);
    this.inputSize = config.inputSize;
    this.outputSize = config.outputSize;
    this.weightInit = config.weightInit;
    this.layers = this.buildLayers(config);
  }

  private validateConfig(config: NetworkConfig): void {
    if (!Number.isInteger(config.inputSize) || config.inputSize <= 0) {
      throw new Error('inputSize must be a positive integer');
    }
    if (!Number.isInteger(config.outputSize) || config.outputSize <= 0) {
      throw new Error('outputSize must be a positive integer');
    }
    if (!Array.isArray(config.hiddenLayers)) {
      throw new Error('hiddenLayers must be an array');
    }
    for (const layer of config.hiddenLayers) {
      if (!Number.isInteger(layer.size) || layer.size <= 0) {
        throw new Error('Each hidden layer size must be a positive integer');
      }
      if (!allActivationNames().includes(layer.activation)) {
        throw new Error(
          `Unknown hidden layer activation: ${layer.activation}`,
        );
      }
    }
    if (!allActivationNames().includes(config.outputActivation)) {
      throw new Error(
        `Unknown output activation: ${config.outputActivation}`,
      );
    }
  }

  private buildLayers(config: NetworkConfig): DenseLayer[] {
    const layers: DenseLayer[] = [];
    let prevSize = config.inputSize;

    for (const hidden of config.hiddenLayers) {
      layers.push(
        createDenseLayer({
          inputSize: prevSize,
          outputSize: hidden.size,
          activation: hidden.activation,
          weightInit: config.weightInit,
        }),
      );
      prevSize = hidden.size;
    }

    layers.push(
      createDenseLayer({
        inputSize: prevSize,
        outputSize: config.outputSize,
        activation: config.outputActivation,
        weightInit: config.weightInit,
      }),
    );

    return layers;
  }

  layerCount(): number {
    return this.layers.length;
  }

  getLayers(): DenseLayer[] {
    return this.layers;
  }

  hiddenLayerCount(): number {
    return this.layers.length - 1;
  }

  getLayerConfig(index: number): DenseLayerConfig {
    const layer = this.layers[index];
    if (!layer) {
      throw new Error(`Layer index ${index} out of range`);
    }
    return {
      inputSize: layer.inputSize,
      outputSize: layer.outputSize,
      activation: layer.activation.name,
      weightInit: this.weightInit,
    };
  }

  setLayerActivation(index: number, activation: ActivationName): void {
    const layer = this.layers[index];
    if (!layer) {
      throw new Error(`Layer index ${index} out of range`);
    }
    if (!allActivationNames().includes(activation)) {
      throw new Error(`Unknown activation: ${activation}`);
    }
    layer.activation = getActivation(activation);
  }

  forward(input: number[]): ForwardResult {
    if (input.length !== this.inputSize) {
      throw new Error(
        `Expected ${this.inputSize} inputs, received ${input.length}`,
      );
    }

    let current: Matrix = columnVector(input);
    const layerOutputs: Matrix[] = [];
    const layerInputs: Matrix[] = [];

    for (const layer of this.layers) {
      layerInputs.push(copy(current));
      current = denseForward(layer, current);
      layerOutputs.push(copy(current));
    }

    return {
      output: flatten(current),
      layerOutputs,
      layerInputs,
    };
  }

  predict(input: number[]): number[] {
    return this.forward(input).output;
  }

  getWeights(): Array<{ weights: Matrix; biases: number[] }> {
    return this.layers.map((layer) => ({
      weights: copy(layer.weights),
      biases: [...layer.biases],
    }));
  }

  setWeights(
    weights: Array<{ weights: Matrix; biases: number[] }>,
  ): void {
    if (weights.length !== this.layers.length) {
      throw new Error(
        `Expected ${this.layers.length} weight sets, received ${weights.length}`,
      );
    }
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const set = weights[i];
      if (
        set.weights.length !== layer.weights.length ||
        set.weights.some(
          (row) => row.length !== layer.weights[0].length,
        )
      ) {
        throw new Error(`Weight set ${i} has incompatible dimensions`);
      }
      if (set.biases.length !== layer.biases.length) {
        throw new Error(`Bias set ${i} has incompatible length`);
      }
      layer.weights = copy(set.weights);
      layer.biases = [...set.biases];
      layer.lastInput = null;
      layer.lastZ = null;
      layer.lastOutput = null;
    }
  }

  getActivationInfos() {
    return this.layers.map((layer, index) => ({
      index,
      layer: index === this.layers.length - 1 ? 'output' : 'hidden',
      activation: activationInfo(layer.activation.name),
      size: layer.outputSize,
    }));
  }

  totalParameters(): number {
    let total = 0;
    for (const layer of this.layers) {
      total += layer.weights.length * layer.weights[0].length;
      total += layer.biases.length;
    }
    return total;
  }

  activate(layerIndex: number, input: number[]): number[] {
    if (layerIndex < 0 || layerIndex >= this.layers.length) {
      throw new Error(`Layer index ${layerIndex} out of range`);
    }
    if (input.length !== this.inputSize) {
      throw new Error(`Expected ${this.inputSize} inputs`);
    }
    let current: Matrix = columnVector(input);
    for (let i = 0; i <= layerIndex; i++) {
      current = denseForward(this.layers[i], current);
    }
    return flatten(current);
  }
}

export function createDefaultConfig(): NetworkConfig {
  return {
    inputSize: 2,
    outputSize: 1,
    hiddenLayers: [{ size: 4, activation: 'tanh' }],
    outputActivation: 'sigmoid',
    weightInit: 'xavier',
  };
}

export function presetConfigs(): Record<string, NetworkConfig> {
  return {
    'single-layer': {
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [],
      outputActivation: 'sigmoid',
      weightInit: 'xavier',
    },
    xor: {
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 4, activation: 'tanh' }],
      outputActivation: 'sigmoid',
      weightInit: 'xavier',
    },
    'two-layer': {
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [
        { size: 8, activation: 'tanh' },
        { size: 4, activation: 'tanh' },
      ],
      outputActivation: 'sigmoid',
      weightInit: 'xavier',
    },
    'three-layer': {
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [
        { size: 10, activation: 'tanh' },
        { size: 6, activation: 'tanh' },
        { size: 4, activation: 'tanh' },
      ],
      outputActivation: 'sigmoid',
      weightInit: 'xavier',
    },
    regression: {
      inputSize: 1,
      outputSize: 1,
      hiddenLayers: [{ size: 8, activation: 'tanh' }],
      outputActivation: 'linear',
      weightInit: 'xavier',
    },
    spiral: {
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [
        { size: 12, activation: 'tanh' },
        { size: 8, activation: 'tanh' },
      ],
      outputActivation: 'sigmoid',
      weightInit: 'he',
    },
    circles: {
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 8, activation: 'tanh' }],
      outputActivation: 'sigmoid',
      weightInit: 'xavier',
    },
    digits: {
      inputSize: 784,
      outputSize: 10,
      hiddenLayers: [
        { size: 64, activation: 'relu' },
        { size: 32, activation: 'relu' },
      ],
      outputActivation: 'softmax',
      weightInit: 'he',
    },
  };
}
