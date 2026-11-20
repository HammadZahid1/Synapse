import { describe, it, expect } from 'vitest';
import {
  createOptimizer,
  applyOptimizer,
  initOptimizerState,
  optimizerInfo,
  defaultOptimizerConfig,
} from '@/lib/ml/optimizers';

describe('optimizers', () => {
  const baseLayer = {
    weights: [[1, 2], [3, 4]],
    biases: [0.5, -0.5],
  } as unknown as never;
  const grads = [
    {
      weights: [[0.1, 0.2], [0.3, 0.4]],
      biases: [0.05, 0.05],
    },
  ];

  it('sgd applies learning-rate scaled gradients', () => {
    const layer = JSON.parse(JSON.stringify(baseLayer));
    const opt = createOptimizer({ name: 'sgd', learningRate: 0.1 });
    initOptimizerState(opt, 1, [{ rows: 2, cols: 2, biasCount: 2 }]);
    applyOptimizer(opt, [layer as never], grads as never);
    expect((layer as any).weights[0][0]).toBeCloseTo(0.99, 6);
    expect((layer as any).weights[0][1]).toBeCloseTo(1.98, 6);
    expect((layer as any).weights[1][0]).toBeCloseTo(2.97, 6);
    expect((layer as any).biases[0]).toBeCloseTo(0.495, 6);
  });

  it('momentum accumulates velocity across steps', () => {
    const layer = JSON.parse(JSON.stringify(baseLayer));
    const opt = createOptimizer({
      name: 'momentum',
      learningRate: 0.1,
      momentum: 0.9,
    });
    initOptimizerState(opt, 1, [{ rows: 2, cols: 2, biasCount: 2 }]);
    applyOptimizer(opt, [layer as never], grads as never);
    expect((layer as any).weights[0][0]).toBeCloseTo(0.99, 6);
    applyOptimizer(opt, [layer as never], grads as never);
    expect((layer as any).weights[0][0]).toBeCloseTo(0.971, 6);
  });

  it('adam applies adaptive first-step update', () => {
    const layer = { weights: [[1, 2]], biases: [0] } as unknown as never;
    const g = [{ weights: [[1, 1]], biases: [1] }];
    const opt = createOptimizer({
      name: 'adam',
      learningRate: 0.1,
      beta1: 0.9,
      beta2: 0.999,
      epsilon: 1e-8,
    });
    initOptimizerState(opt, 1, [{ rows: 1, cols: 2, biasCount: 1 }]);
    applyOptimizer(opt, [layer as never], g as never);
    expect((layer as any).weights[0][0]).toBeCloseTo(0.9, 6);
    expect((layer as any).biases[0]).toBeCloseTo(-0.1, 6);
  });

  it('throws on invalid learning rate', () => {
    expect(() => createOptimizer({ name: 'sgd', learningRate: 0 })).toThrow();
    expect(() => createOptimizer({ name: 'sgd', learningRate: -1 })).toThrow();
    expect(() => createOptimizer({ name: 'sgd', learningRate: NaN })).toThrow();
  });

  it('optimizer info and defaults', () => {
    expect(optimizerInfo('adam').name).toBe('adam');
    expect(typeof optimizerInfo('sgd').description).toBe('string');
    const cfg = defaultOptimizerConfig(0.05);
    expect(cfg.learningRate).toBe(0.05);
    expect(cfg.momentum).toBe(0.9);
  });
});
