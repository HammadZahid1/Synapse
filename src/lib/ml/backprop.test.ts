import { describe, it, expect } from 'vitest';
import { NeuralNetwork } from '@/lib/ml/network';
import { backpropagate } from '@/lib/ml/backprop';

describe('backpropagation', () => {
  it('computes gradients matching finite differences', () => {
    const net = new NeuralNetwork({
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 2, activation: 'linear' }],
      outputActivation: 'linear',
      weightInit: 'zeros',
    });

    net.setWeights([
      { weights: [[0.5, -0.2], [0.1, 0.4]], biases: [0.1, -0.1] },
      { weights: [[0.3, 0.6]], biases: [0.05] },
    ]);

    const input = [1, 2];
    const target = [1];
    const result = backpropagate(net, input, target, 'mse');

    expect(result.output.length).toBe(1);
    expect(result.gradients.length).toBe(2);
    expect(result.gradients[0].weights.length).toBe(2);
    expect(result.gradients[0].weights[0].length).toBe(2);
    expect(result.gradients[0].biases.length).toBe(2);
    expect(result.gradients[1].weights.length).toBe(1);
    expect(result.gradients[1].weights[0].length).toBe(2);

    // Finite difference check on one output weight
    const eps = 1e-6;
    const w0 = net.getLayerConfig(0);
    const original = net.getWeights()[1].weights[0][0];
    const lossAt = (w: number) => {
      const weights = net.getWeights();
      weights[1].weights[0][0] = w;
      net.setWeights(weights);
      const r = backpropagate(net, input, target, 'mse');
      return r.loss;
    };
    net.setWeights([
      { weights: [[0.5, -0.2], [0.1, 0.4]], biases: [0.1, -0.1] },
      { weights: [[0.3, 0.6]], biases: [0.05] },
    ]);
    const numeric = (lossAt(original + eps) - lossAt(original - eps)) / (2 * eps);
    const analytic = result.gradients[1].weights[0][0];
    expect(analytic).toBeCloseTo(numeric, 4);
  });

  it('applying gradient descent reduces loss', () => {
    const net = new NeuralNetwork({
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 2, activation: 'linear' }],
      outputActivation: 'linear',
      weightInit: 'random',
    });

    const input = [1, 2];
    const target = [5];
    const before = backpropagate(net, input, target, 'mse').loss;

    const gradients = backpropagate(net, input, target, 'mse').gradients;
    const layers = net.getLayers();
    const lr = 0.01;
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
    }

    const after = backpropagate(net, input, target, 'mse').loss;
    expect(after).toBeLessThan(before);
  });

  it('propagates error through hidden layer', () => {
    const net = new NeuralNetwork({
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: 1, activation: 'linear' }],
      outputActivation: 'linear',
      weightInit: 'zeros',
    });
    net.setWeights([
      { weights: [[1, 1]], biases: [0] },
      { weights: [[1]], biases: [0] },
    ]);
    const result = backpropagate(net, [1, 2], [0], 'mse');
    // prediction = 3, error wrt output = 2*(3-0)/1 = 6 (single sample n=1)
    // hidden output = 3, so dW_out = 6 * 3 = 18
    expect(result.gradients[1].weights[0][0]).toBeCloseTo(18, 4);
    expect(result.gradients[0].weights[0][0]).toBeCloseTo(6 * 1, 4);
    expect(result.gradients[0].weights[0][1]).toBeCloseTo(6 * 2, 4);
  });
});
