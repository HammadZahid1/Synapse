import { LayerGradients } from './backprop';
import {
  DenseLayer,
} from './dense';

export type OptimizerName = 'sgd' | 'momentum' | 'adam';

export interface OptimizerConfig {
  name: OptimizerName;
  learningRate: number;
  momentum?: number;
  beta1?: number;
  beta2?: number;
  epsilon?: number;
}

export interface OptimizerState {
  name: OptimizerName;
  learningRate: number;
  velocity?: Array<{ weights: number[][]; biases: number[] }>;
  m?: Array<{ weights: number[][]; biases: number[] }>;
  v?: Array<{ weights: number[][]; biases: number[] }>;
  t: number;
}

export function createOptimizer(config: OptimizerConfig): OptimizerState {
  const lr = config.learningRate;
  if (!Number.isFinite(lr) || lr <= 0) {
    throw new Error('Learning rate must be a positive finite number');
  }
  return {
    name: config.name,
    learningRate: lr,
    ...(config.name === 'momentum' ? { velocity: [] } : {}),
    ...(config.name === 'adam'
      ? { m: [], v: [], t: 0 }
      : {}),
  };
}

export function initOptimizerState(
  optimizer: OptimizerState,
  layerCount: number,
  layerShapes: Array<{ rows: number; cols: number; biasCount: number }>,
): void {
  if (optimizer.name === 'momentum') {
    optimizer.velocity = layerShapes.map((s) => ({
      weights: new Array(s.rows).fill(0).map(() => new Array(s.cols).fill(0)),
      biases: new Array(s.biasCount).fill(0),
    }));
  }
  if (optimizer.name === 'adam') {
    optimizer.m = layerShapes.map((s) => ({
      weights: new Array(s.rows).fill(0).map(() => new Array(s.cols).fill(0)),
      biases: new Array(s.biasCount).fill(0),
    }));
    optimizer.v = layerShapes.map((s) => ({
      weights: new Array(s.rows).fill(0).map(() => new Array(s.cols).fill(0)),
      biases: new Array(s.biasCount).fill(0),
    }));
    optimizer.t = 0;
  }
}

export function applyOptimizer(
  optimizer: OptimizerState,
  layers: DenseLayer[],
  gradients: LayerGradients[],
): void {
  if (gradients.length !== layers.length) {
    throw new Error('Gradient count does not match layer count');
  }

  const layerShapes = layers.map((layer) => ({
    rows: layer.weights.length,
    cols: layer.weights[0].length,
    biasCount: layer.biases.length,
  }));

  if (
    (optimizer.name === 'momentum' && !optimizer.velocity) ||
    (optimizer.name === 'adam' && (!optimizer.m || !optimizer.v))
  ) {
    initOptimizerState(optimizer, layers.length, layerShapes);
  }

  switch (optimizer.name) {
    case 'sgd':
      applySGD(optimizer, layers, gradients);
      break;
    case 'momentum':
      applyMomentum(optimizer, layers, gradients);
      break;
    case 'adam':
      applyAdam(optimizer, layers, gradients);
      break;
  }
}

function applySGD(
  optimizer: OptimizerState,
  layers: DenseLayer[],
  gradients: LayerGradients[],
): void {
  const lr = optimizer.learningRate;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const g = gradients[i];
    for (let r = 0; r < layer.weights.length; r++) {
      for (let c = 0; c < layer.weights[0].length; c++) {
        layer.weights[r][c] -= lr * g.weights[r][c];
      }
    }
    for (let b = 0; b < layer.biases.length; b++) {
      layer.biases[b] -= lr * g.biases[b];
    }
    layer.lastInput = null;
    layer.lastZ = null;
    layer.lastOutput = null;
  }
}

function applyMomentum(
  optimizer: OptimizerState,
  layers: DenseLayer[],
  gradients: LayerGradients[],
): void {
  const lr = optimizer.learningRate;
  const beta = optimizer.momentum ?? 0.9;
  const velocity = optimizer.velocity!;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const g = gradients[i];
    const v = velocity[i];
    for (let r = 0; r < layer.weights.length; r++) {
      for (let c = 0; c < layer.weights[0].length; c++) {
        v.weights[r][c] = beta * v.weights[r][c] - lr * g.weights[r][c];
        layer.weights[r][c] += v.weights[r][c];
      }
    }
    for (let b = 0; b < layer.biases.length; b++) {
      v.biases[b] = beta * v.biases[b] - lr * g.biases[b];
      layer.biases[b] += v.biases[b];
    }
    layer.lastInput = null;
    layer.lastZ = null;
    layer.lastOutput = null;
  }
}

function applyAdam(
  optimizer: OptimizerState,
  layers: DenseLayer[],
  gradients: LayerGradients[],
): void {
  const lr = optimizer.learningRate;
  const beta1 = optimizer.beta1 ?? 0.9;
  const beta2 = optimizer.beta2 ?? 0.999;
  const eps = optimizer.epsilon ?? 1e-8;
  optimizer.t++;
  const t = optimizer.t;
  const m = optimizer.m!;
  const v = optimizer.v!;

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const g = gradients[i];
    const mi = m[i];
    const vi = v[i];
    for (let r = 0; r < layer.weights.length; r++) {
      for (let c = 0; c < layer.weights[0].length; c++) {
        mi.weights[r][c] = beta1 * mi.weights[r][c] + (1 - beta1) * g.weights[r][c];
        vi.weights[r][c] = beta2 * vi.weights[r][c] + (1 - beta2) * g.weights[r][c] * g.weights[r][c];
        const mHat = mi.weights[r][c] / (1 - Math.pow(beta1, t));
        const vHat = vi.weights[r][c] / (1 - Math.pow(beta2, t));
        layer.weights[r][c] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
      }
    }
    for (let b = 0; b < layer.biases.length; b++) {
      mi.biases[b] = beta1 * mi.biases[b] + (1 - beta1) * g.biases[b];
      vi.biases[b] = beta2 * vi.biases[b] + (1 - beta2) * g.biases[b] * g.biases[b];
      const mHat = mi.biases[b] / (1 - Math.pow(beta1, t));
      const vHat = vi.biases[b] / (1 - Math.pow(beta2, t));
      layer.biases[b] -= (lr * mHat) / (Math.sqrt(vHat) + eps);
    }
    layer.lastInput = null;
    layer.lastZ = null;
    layer.lastOutput = null;
  }
}

export function optimizerInfo(name: OptimizerName) {
  const descriptions: Record<OptimizerName, string> = {
    sgd: 'Stochastic gradient descent. Simple, stable baseline.',
    momentum: 'SGD with momentum. Accelerates along consistent directions.',
    adam: 'Adaptive moment estimation. Per-parameter learning rates.',
  };
  return { name, description: descriptions[name] };
}

export function defaultOptimizerConfig(learningRate = 0.1): OptimizerConfig {
  return {
    name: 'sgd',
    learningRate: lrFinite(learningRate),
    momentum: 0.9,
    beta1: 0.9,
    beta2: 0.999,
    epsilon: 1e-8,
  };
}

function lrFinite(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0.1;
}
