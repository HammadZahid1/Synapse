import {
  Matrix,
  subtract,
  scale,
  map,
} from '@/lib/math/matrix';

export type LossName = 'mse' | 'binary-cross-entropy' | 'categorical-cross-entropy';

export interface LossFunction {
  name: LossName;
  compute: (predicted: Matrix, target: Matrix) => number;
  gradient: (predicted: Matrix, target: Matrix) => Matrix;
}

function clip(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const losses: Record<LossName, LossFunction> = {
  'mse': {
    name: 'mse',
    compute: (predicted, target) => {
      const diff = subtract(predicted, target);
      const squared = map(diff, (v) => v * v);
      let sum = 0;
      for (const row of squared) for (const v of row) sum += v;
      const count = predicted.length * predicted[0].length;
      return sum / count;
    },
    gradient: (predicted, target) => {
      const diff = subtract(predicted, target);
      const n = predicted.length * predicted[0].length;
      return scale(diff, 2 / n);
    },
  },
  'binary-cross-entropy': {
    name: 'binary-cross-entropy',
    compute: (predicted, target) => {
      const eps = 1e-12;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < predicted.length; i++) {
        for (let j = 0; j < predicted[0].length; j++) {
          const p = clip(predicted[i][j], eps, 1 - eps);
          const t = target[i][j];
          sum += t * Math.log(p) + (1 - t) * Math.log(1 - p);
          count++;
        }
      }
      return -(sum / count);
    },
    gradient: (predicted, target) => {
      const eps = 1e-12;
      const rows = predicted.length;
      const cols = predicted[0].length;
      const result: Matrix = new Array(rows);
      for (let i = 0; i < rows; i++) {
        result[i] = new Array(cols);
        for (let j = 0; j < cols; j++) {
          const p = clip(predicted[i][j], eps, 1 - eps);
          result[i][j] = -(target[i][j] / p - (1 - target[i][j]) / (1 - p));
        }
      }
      const n = rows * cols;
      return scale(result, 1 / n);
    },
  },
  'categorical-cross-entropy': {
    name: 'categorical-cross-entropy',
    compute: (predicted, target) => {
      const eps = 1e-12;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < predicted.length; i++) {
        for (let j = 0; j < predicted[0].length; j++) {
          const p = clip(predicted[i][j], eps, 1 - eps);
          sum += target[i][j] * Math.log(p);
          count++;
        }
      }
      return -(sum / count);
    },
    gradient: (predicted, target) => {
      const eps = 1e-12;
      const rows = predicted.length;
      const cols = predicted[0].length;
      const result: Matrix = new Array(rows);
      for (let i = 0; i < rows; i++) {
        result[i] = new Array(cols);
        for (let j = 0; j < cols; j++) {
          result[i][j] = -(target[i][j] / clip(predicted[i][j], eps, 1));
        }
      }
      const n = rows * cols;
      return scale(result, 1 / n);
    },
  },
};

export function getLoss(name: LossName): LossFunction {
  const fn = losses[name];
  if (!fn) {
    throw new Error(`Unknown loss function: ${name}`);
  }
  return fn;
}

export function allLossNames(): LossName[] {
  return ['mse', 'binary-cross-entropy', 'categorical-cross-entropy'];
}

export function lossInfo(name: LossName) {
  const descriptions: Record<LossName, string> = {
    'mse': 'Mean squared error. Best for regression tasks.',
    'binary-cross-entropy': 'Binary cross-entropy. Best for binary classification with sigmoid outputs.',
    'categorical-cross-entropy': 'Categorical cross-entropy. Best for multi-class classification with softmax outputs.',
  };
  return {
    name,
    description: descriptions[name],
  };
}
