import { describe, it, expect } from 'vitest';
import { NeuralNetwork, presetConfigs } from '@/lib/ml/network';
import { TrainingEngine } from '@/lib/ml/training';
import { xorDataset } from '@/lib/datasets/generators';

describe('training logic', () => {
  it('reduces loss on XOR over epochs', async () => {
    const net = new NeuralNetwork(presetConfigs().xor);
    const dataset = xorDataset();
    const engine = new TrainingEngine();

    const result = await engine.train(net, dataset, {
      epochs: 200,
      learningRate: 0.1,
      batchSize: 1,
      optimizer: 'sgd',
      loss: 'mse',
      validationSplit: 0,
      shuffle: true,
    });

    expect(result.status).toBe('completed');
    expect(result.epochsCompleted).toBe(200);
    expect(result.history).toHaveLength(200);
    expect(result.history[0].loss).toBeGreaterThan(result.finalLoss);
    expect(result.finalLoss).toBeLessThan(0.5);
  });

  it('supports pause and resume', async () => {
    const net = new NeuralNetwork(presetConfigs().xor);
    const dataset = xorDataset();
    const engine = new TrainingEngine();

    const started = engine.train(net, dataset, {
      epochs: 50,
      learningRate: 0.5,
      batchSize: 1,
      optimizer: 'sgd',
      loss: 'mse',
      validationSplit: 0,
      shuffle: false,
    });

    engine.pause();
    expect(engine.getStatus()).toBe('paused');
    engine.resume();
    expect(engine.getStatus()).toBe('training');

    const result = await started;
    expect(result.status).toBe('completed');
  });

  it('supports stop', async () => {
    const net = new NeuralNetwork(presetConfigs().xor);
    const dataset = xorDataset();
    const engine = new TrainingEngine();

    const started = engine.train(net, dataset, {
      epochs: 500,
      learningRate: 0.5,
      batchSize: 1,
      optimizer: 'sgd',
      loss: 'mse',
      validationSplit: 0,
      shuffle: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    engine.stop();
    expect(engine.getStatus()).toBe('stopped');

    const result = await started;
    expect(result.status).toBe('stopped');
    expect(result.epochsCompleted).toBeLessThan(500);
  });

  it('rejects invalid configuration', async () => {
    const net = new NeuralNetwork(presetConfigs().xor);
    const dataset = xorDataset();
    const engine = new TrainingEngine();

    await expect(
      engine.train(net, dataset, { epochs: 0, learningRate: 0.1, batchSize: 1, optimizer: 'sgd', loss: 'mse', validationSplit: 0, shuffle: true }),
    ).rejects.toThrow();

    await expect(
      engine.train(net, dataset, { epochs: 10, learningRate: -1, batchSize: 1, optimizer: 'sgd', loss: 'mse', validationSplit: 0, shuffle: true }),
    ).rejects.toThrow();
  });

  it('works with adam and momentum optimizers', async () => {
    const dataset = xorDataset();
    const engine = new TrainingEngine();

    for (const optimizer of ['momentum', 'adam'] as const) {
      const net = new NeuralNetwork(presetConfigs().xor);
      const result = await engine.train(net, dataset, {
        epochs: 150,
        learningRate: 0.05,
        batchSize: 2,
        optimizer,
        loss: 'mse',
        validationSplit: 0,
        shuffle: true,
      });
      expect(result.status).toBe('completed');
      expect(result.finalLoss).toBeLessThan(1);
    }
  });
});
