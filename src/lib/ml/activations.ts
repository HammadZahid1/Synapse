import {
  stableSoftmax,
  sigmoidDerivativeFromOutput,
  map,
  Matrix,
} from '@/lib/math/matrix';

export type ActivationName =
  | 'sigmoid'
  | 'relu'
  | 'tanh'
  | 'softmax'
  | 'linear';

export interface ActivationFunction {
  name: ActivationName;
  forward: (value: number) => number;
  derivative: (output: number) => number;
  forwardMatrix: (matrix: Matrix) => Matrix;
  derivativeMatrix: (matrix: Matrix) => Matrix;
}

function pointwise(fn: (v: number) => number, matrix: Matrix): Matrix {
  return map(matrix, fn);
}

export const activations: Record<ActivationName, ActivationFunction> = {
  sigmoid: {
    name: 'sigmoid',
    forward: (x) => 1 / (1 + Math.exp(-x)),
    derivative: sigmoidDerivativeFromOutput,
    forwardMatrix: (m) => pointwise((x) => 1 / (1 + Math.exp(-x)), m),
    derivativeMatrix: (m) => pointwise(sigmoidDerivativeFromOutput, m),
  },
  relu: {
    name: 'relu',
    forward: (x) => Math.max(0, x),
    derivative: (y) => (y > 0 ? 1 : 0),
    forwardMatrix: (m) => pointwise((x) => Math.max(0, x), m),
    derivativeMatrix: (m) => pointwise((y) => (y > 0 ? 1 : 0), m),
  },
  tanh: {
    name: 'tanh',
    forward: (x) => Math.tanh(x),
    derivative: (y) => 1 - y * y,
    forwardMatrix: (m) => pointwise(Math.tanh, m),
    derivativeMatrix: (m) => pointwise((y) => 1 - y * y, m),
  },
  linear: {
    name: 'linear',
    forward: (x) => x,
    derivative: () => 1,
    forwardMatrix: (m) => copyMatrix(m),
    derivativeMatrix: (m) => map(m, () => 1),
  },
  softmax: {
    name: 'softmax',
    forward: (x) => x, // handled per-row at layer level
    derivative: () => 1,
    forwardMatrix: (m) =>
      m.map((row) => stableSoftmax(row)),
    derivativeMatrix: (m) => map(m, () => 1),
  },
};

function copyMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

export function getActivation(name: ActivationName): ActivationFunction {
  const fn = activations[name];
  if (!fn) {
    throw new Error(`Unknown activation function: ${name}`);
  }
  return fn;
}

export function allActivationNames(): ActivationName[] {
  return ['sigmoid', 'relu', 'tanh', 'softmax', 'linear'];
}

export function activationInfo(name: ActivationName) {
  const fn = getActivation(name);
  const descriptions: Record<ActivationName, string> = {
    sigmoid: 'Squashes input to (0, 1). Smooth, probabilistic output.',
    relu: 'Rectified linear unit. f(x) = max(0, x). Sparse activations.',
    tanh: 'Hyperbolic tangent. Squashes input to (-1, 1). Zero-centered.',
    softmax: 'Normalizes a vector into a probability distribution.',
    linear: 'Identity. f(x) = x. Used for regression outputs.',
  };
  return {
    name: fn.name,
    description: descriptions[name],
    range:
      name === 'sigmoid'
        ? '(0, 1)'
        : name === 'tanh'
          ? '(-1, 1)'
          : name === 'softmax'
            ? 'probability simplex'
            : '(-∞, ∞)',
  };
}
