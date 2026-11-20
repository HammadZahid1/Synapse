import { describe, it, expect } from 'vitest';
import {
  xorDataset,
  circleDataset,
  twoMoonsDataset,
  spiralDataset,
  gaussianClustersDataset,
  binaryClassificationDataset,
  linearRegressionDataset,
  allDatasets,
} from '@/lib/datasets/generators';
import { validateDataset, validateNetworkConfiguration, validateTrainingConfiguration } from '@/lib/datasets/validation';

describe('dataset generators', () => {
  it('xor dataset has correct shape and labels', () => {
    const ds = xorDataset();
    expect(ds.inputs).toHaveLength(4);
    expect(ds.targets).toHaveLength(4);
    expect(ds.inputs[0]).toHaveLength(2);
    expect(ds.targets[0]).toHaveLength(1);
    expect(ds.classes).toEqual(['0', '1']);
  });

  it('circle dataset produces two classes', () => {
    const ds = circleDataset({ count: 200 });
    expect(ds.inputs).toHaveLength(200);
    expect(ds.targets).toHaveLength(200);
    const classes = new Set(ds.targets.map((t) => t[0]));
    expect(classes.size).toBe(2);
  });

  it('two moons dataset interleaves classes', () => {
    const ds = twoMoonsDataset({ count: 200 });
    expect(ds.inputs).toHaveLength(200);
    expect(ds.targets).toHaveLength(200);
    const classes = new Set(ds.targets.map((t) => t[0]));
    expect(classes.size).toBe(2);
  });

  it('spiral dataset produces two intertwined classes', () => {
    const ds = spiralDataset({ count: 400 });
    expect(ds.inputs).toHaveLength(400);
    const classes = new Set(ds.targets.map((t) => t[0]));
    expect(classes.size).toBe(2);
  });

  it('gaussian clusters produce requested cluster count', () => {
    const ds = gaussianClustersDataset({ count: 400, clusters: 4 });
    expect(ds.inputs).toHaveLength(400);
    const classes = new Set(ds.targets.map((t) => t[0]));
    expect(classes.size).toBe(4);
  });

  it('binary classification is linearly separable-ish', () => {
    const ds = binaryClassificationDataset({ count: 100, separation: 3 });
    expect(ds.inputs).toHaveLength(100);
    const left = ds.inputs.filter((p) => p[0] < 0);
    const right = ds.inputs.filter((p) => p[0] > 0);
    expect(left.length).toBeGreaterThan(0);
    expect(right.length).toBeGreaterThan(0);
  });

  it('linear regression dataset has one-dimensional inputs and targets', () => {
    const ds = linearRegressionDataset({ count: 50 });
    expect(ds.inputs).toHaveLength(50);
    expect(ds.targets).toHaveLength(50);
    expect(ds.inputs.every((p) => p.length === 1)).toBe(true);
    expect(ds.targets.every((t) => t.length === 1)).toBe(true);
  });

  it('allDatasets lists every generator with type', () => {
    const list = allDatasets();
    expect(list.length).toBe(7);
    expect(list.map((d) => d.id).sort()).toEqual([
      'binary', 'circles', 'clusters', 'linear', 'moons', 'spiral', 'xor',
    ]);
    expect(list.every((d) => typeof d.generate === 'function')).toBe(true);
    expect(list.some((d) => d.type === 'regression')).toBe(true);
    expect(list.some((d) => d.type === 'classification')).toBe(true);
  });
});

describe('dataset validation', () => {
  it('accepts a valid dataset', () => {
    const result = validateDataset([[1, 2], [3, 4]], [[0], [1]], 2, 1);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects mismatched input and target counts', () => {
    const result = validateDataset([[1], [2], [3]], [[0], [1]]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects non-finite values', () => {
    const result = validateDataset([[1, NaN]], [[0]], 2, 1);
    expect(result.valid).toBe(false);
  });

  it('rejects wrong expected dimensions', () => {
    const result = validateDataset([[1]], [[0]], 2, 1);
    expect(result.valid).toBe(false);
  });

  it('validates network configuration', () => {
    expect(validateNetworkConfiguration(2, 1, [{ size: 4 }]).valid).toBe(true);
    expect(validateNetworkConfiguration(0, 1, []).valid).toBe(false);
    expect(validateNetworkConfiguration(2, 1, [{ size: 0 }]).valid).toBe(false);
  });

  it('validates training configuration', () => {
    expect(validateTrainingConfiguration({ epochs: 10, learningRate: 0.1, batchSize: 4 }).valid).toBe(true);
    expect(validateTrainingConfiguration({ epochs: 0 }).valid).toBe(false);
    expect(validateTrainingConfiguration({ learningRate: -0.1 }).valid).toBe(false);
    expect(validateTrainingConfiguration({ validationSplit: 1.2 }).valid).toBe(false);
  });
});
