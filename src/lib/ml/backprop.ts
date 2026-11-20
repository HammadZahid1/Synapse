import {
  Matrix,
  dot,
  transpose,
  multiply,
  scale,
  subtract,
  columnVector,
  flatten,
} from '@/lib/math/matrix';
import { NeuralNetwork } from './network';
import { DenseLayer } from './dense';
import { getLoss, LossName } from './loss';

export interface LayerGradients {
  weights: Matrix;
  biases: number[];
}

export interface BackpropResult {
  loss: number;
  output: number[];
  gradients: LayerGradients[];
}

export function backpropagate(
  network: NeuralNetwork,
  input: number[],
  target: number[],
  lossName: LossName,
): BackpropResult {
  const lossFn = getLoss(lossName);
  const forward = network.forward(input);
  const predicted = columnVector(forward.output);
  const targetMatrix = columnVector(target);

  const loss = lossFn.compute(predicted, targetMatrix);

  const layerCount = network.layerCount();
  const layers = (network as any).layers as unknown as DenseLayer[];

  // Access cached forward state
  const activations: Matrix[] = [columnVector(input)];
  for (const layer of layers) {
    activations.push(copyMatrix(layer.lastOutput!));
  }

  const gradients: LayerGradients[] = new Array(layerCount);

  // Output layer delta
  const outputLossGrad = lossFn.gradient(predicted, targetMatrix);
  const outputLayer = layers[layerCount - 1];
  let delta = multiply(
    outputLossGrad,
    outputLayer.activation.derivativeMatrix(activations[layerCount]),
  );

  gradients[layerCount - 1] = {
    weights: dot(delta, transpose(activations[layerCount - 1])),
    biases: flatten(delta),
  };

  // Hidden layers
  for (let l = layerCount - 2; l >= 0; l--) {
    const nextLayer = layers[l + 1];
    const currentLayer = layers[l];
    delta = multiply(
      dot(transpose(nextLayer.weights), delta),
      currentLayer.activation.derivativeMatrix(activations[l + 1]),
    );
    gradients[l] = {
      weights: dot(delta, transpose(activations[l])),
      biases: flatten(delta),
    };
  }

  return { loss, output: forward.output, gradients };
}

function copyMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

export function applyGradients(
  network: NeuralNetwork,
  gradients: LayerGradients[],
  learningRate: number,
): void {
  const layers = (network as any).layers as unknown as DenseLayer[];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const grad = gradients[i];
    layer.weights = subtract(layer.weights, scale(grad.weights, learningRate));
    for (let b = 0; b < layer.biases.length; b++) {
      layer.biases[b] -= learningRate * grad.biases[b];
    }
    layer.lastInput = null;
    layer.lastZ = null;
    layer.lastOutput = null;
  }
}
