import { describe, it, expect } from 'vitest';
import { NeuralNetwork, createDefaultConfig, presetConfigs } from '@/lib/ml/network';

describe('forward propagation', () => {
  it('computes forward pass with deterministic weights', () => {
    const net = new NeuralNetwork({
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 2, activation: 'linear' }],
      outputActivation: 'linear',
      weightInit: 'zeros',
    });

    net.setWeights([
      { weights: [[1, 0], [0, 1]], biases: [0, 0] },
      { weights: [[1, 1]], biases: [0] },
    ]);

    const result = net.forward([1, 2]);
    expect(result.output).toEqual([3]);
    expect(result.layerOutputs.length).toBe(2);
  });

  it('rejects wrong input dimension', () => {
    const net = new NeuralNetwork(createDefaultConfig());
    expect(() => net.forward([1])).toThrow(/inputs/);
  });

  it('rejects incompatible weight shapes', () => {
    const net = new NeuralNetwork(createDefaultConfig());
    expect(() =>
      net.setWeights([
        { weights: [[1, 2]], biases: [0] },
        { weights: [[1]], biases: [0] },
      ]),
    ).toThrow(/incompatible/);
  });

  it('reports total parameters', () => {
    const net = new NeuralNetwork({
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 3, activation: 'relu' }],
      outputActivation: 'sigmoid',
      weightInit: 'zeros',
    });
    // hidden: 3x2 weights + 3 biases = 9; output: 1x3 weights + 1 bias = 4
    expect(net.totalParameters()).toBe(13);
  });

  it('exposes layer configs and activation infos', () => {
    const net = new NeuralNetwork(createDefaultConfig());
    expect(net.layerCount()).toBe(2);
    expect(net.hiddenLayerCount()).toBe(1);
    const configs = net.getLayerConfig(0);
    expect(configs.inputSize).toBe(2);
    const infos = net.getActivationInfos();
    expect(infos.length).toBe(2);
  });

  it('loads preset configurations', () => {
    const presets = presetConfigs();
    expect(presets.xor.inputSize).toBe(2);
    expect(presets.digits.inputSize).toBe(784);
    expect(presets.digits.outputSize).toBe(10);
    const net = new NeuralNetwork(presets.spiral);
    expect(net.totalParameters()).toBeGreaterThan(0);
    const out = net.predict([0.5, 0.5]);
    expect(out.length).toBe(1);
  });
});
