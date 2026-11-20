import {
  Matrix,
  randomMatrix,
  zeros,
  dot,
  add,
  transpose,
} from '@/lib/math/matrix';
import { ActivationFunction, getActivation, ActivationName } from './activations';

export type WeightInit = 'xavier' | 'he' | 'random' | 'zeros';

export interface DenseLayerConfig {
  inputSize: number;
  outputSize: number;
  activation: ActivationName;
  weightInit: WeightInit;
}

export interface DenseLayer {
  inputSize: number;
  outputSize: number;
  activation: ActivationFunction;
  weights: Matrix;
  biases: number[];
  lastInput: Matrix | null;
  lastZ: Matrix | null;
  lastOutput: Matrix | null;
}

export function createDenseLayer(config: DenseLayerConfig): DenseLayer {
  const { inputSize, outputSize, weightInit } = config;
  const activation = getActivation(config.activation);

  let weights: Matrix;
  switch (weightInit) {
    case 'xavier': {
      const limit = Math.sqrt(6 / (inputSize + outputSize));
      weights = randomMatrix(outputSize, inputSize, -limit, limit);
      break;
    }
    case 'he': {
      const std = Math.sqrt(2 / inputSize);
      weights = randomMatrix(outputSize, inputSize, -3 * std, 3 * std);
      break;
    }
    case 'random': {
      weights = randomMatrix(outputSize, inputSize, -0.5, 0.5);
      break;
    }
    case 'zeros':
    default: {
      weights = zeros(outputSize, inputSize);
      break;
    }
  }

  const biases = new Array(outputSize).fill(0);

  return {
    inputSize,
    outputSize,
    activation,
    weights,
    biases,
    lastInput: null,
    lastZ: null,
    lastOutput: null,
  };
}

export function denseForward(layer: DenseLayer, input: Matrix): Matrix {
  const z = add(dot(layer.weights, input), columnVector(layer.biases));
  const output = layer.activation.forwardMatrix(z);
  layer.lastInput = copyMatrix(input);
  layer.lastZ = z;
  layer.lastOutput = output;
  return output;
}

function columnVector(values: number[]): Matrix {
  return values.map((v) => [v]);
}

function copyMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

export function randomizeWeights(layer: DenseLayer, init: WeightInit): void {
  const { inputSize, outputSize } = layer;
  let weights: Matrix;
  switch (init) {
    case 'xavier': {
      const limit = Math.sqrt(6 / (inputSize + outputSize));
      weights = randomMatrix(outputSize, inputSize, -limit, limit);
      break;
    }
    case 'he': {
      const std = Math.sqrt(2 / inputSize);
      weights = randomMatrix(outputSize, inputSize, -3 * std, 3 * std);
      break;
    }
    case 'random':
      weights = randomMatrix(outputSize, inputSize, -0.5, 0.5);
      break;
    case 'zeros':
    default:
      weights = zeros(outputSize, inputSize);
      break;
  }
  layer.weights = weights;
  layer.biases = new Array(outputSize).fill(0);
  layer.lastInput = null;
  layer.lastZ = null;
  layer.lastOutput = null;
}

export function setBias(layer: DenseLayer, index: number, value: number): void {
  if (index < 0 || index >= layer.biases.length) {
    throw new Error(`Bias index ${index} out of range`);
  }
  layer.biases[index] = value;
}

export function setWeight(
  layer: DenseLayer,
  outputIndex: number,
  inputIndex: number,
  value: number,
): void {
  if (
    outputIndex < 0 ||
    outputIndex >= layer.weights.length ||
    inputIndex < 0 ||
    inputIndex >= layer.weights[0].length
  ) {
    throw new Error(
      `Weight index [${outputIndex},${inputIndex}] out of range`,
    );
  }
  layer.weights[outputIndex][inputIndex] = value;
}

export function getLayerStats(layer: DenseLayer) {
  const flat: number[] = [];
  for (const row of layer.weights) flat.push(...row);
  flat.push(...layer.biases);
  return {
    weightCount: flat.length - layer.biases.length,
    biasCount: layer.biases.length,
    mean: meanOf(flat),
    min: minOf(flat),
    max: maxOf(flat),
    std: stdOf(flat),
  };
}

function meanOf(values: number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return values.length ? sum / values.length : 0;
}

function minOf(values: number[]): number {
  let result = Infinity;
  for (const v of values) if (v < result) result = v;
  return result === Infinity ? 0 : result;
}

function maxOf(values: number[]): number {
  let result = -Infinity;
  for (const v of values) if (v > result) result = v;
  return result === -Infinity ? 0 : result;
}

function stdOf(values: number[]): number {
  const m = meanOf(values);
  let sum = 0;
  for (const v of values) sum += (v - m) ** 2;
  return Math.sqrt(values.length ? sum / values.length : 0);
}
