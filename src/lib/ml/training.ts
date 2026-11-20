import { applyOptimizer, createOptimizer, initOptimizerState } from './optimizers';
import { backpropagate } from './backprop';
import { NeuralNetwork } from './network';

export type TrainingStatus = 'idle' | 'training' | 'paused' | 'stopped' | 'completed';

export interface Dataset {
  inputs: number[][];
  targets: number[][];
}

export interface TrainingConfig {
  epochs: number;
  learningRate: number;
  batchSize: number;
  optimizer: 'sgd' | 'momentum' | 'adam';
  loss: 'mse' | 'binary-cross-entropy' | 'categorical-cross-entropy';
  validationSplit: number;
  shuffle: boolean;
}

export interface EpochMetrics {
  epoch: number;
  loss: number;
  validationLoss: number | null;
  accuracy: number | null;
  durationMs: number;
}

export interface TrainingResult {
  status: TrainingStatus;
  epochsCompleted: number;
  history: EpochMetrics[];
  finalLoss: number;
  finalValidationLoss: number | null;
  finalAccuracy: number | null;
  durationMs: number;
}

export interface TrainCallbacks {
  onEpoch?: (metrics: EpochMetrics) => void;
  onBatch?: (batchIndex: number, batchCount: number) => void;
}

const DEFAULT_CONFIG: TrainingConfig = {
  epochs: 100,
  learningRate: 0.1,
  batchSize: 1,
  optimizer: 'sgd',
  loss: 'mse',
  validationSplit: 0.2,
  shuffle: true,
};

export function resolveConfig(partial: Partial<TrainingConfig>): TrainingConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

export function validateConfig(config: TrainingConfig): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(config.epochs) || config.epochs <= 0) {
    errors.push('epochs must be a positive integer');
  }
  if (!Number.isFinite(config.learningRate) || config.learningRate <= 0) {
    errors.push('learningRate must be a positive number');
  }
  if (!Number.isInteger(config.batchSize) || config.batchSize <= 0) {
    errors.push('batchSize must be a positive integer');
  }
  if (config.validationSplit < 0 || config.validationSplit >= 1) {
    errors.push('validationSplit must be between 0 and 1');
  }
  return errors;
}

function splitDataset(
  dataset: Dataset,
  validationSplit: number,
  shuffle: boolean,
): { train: Dataset; validation: Dataset } {
  const count = dataset.inputs.length;
  const indices = Array.from({ length: count }, (_, i) => i);
  if (shuffle) {
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }
  const split = Math.floor(count * (1 - validationSplit));
  const trainInputs: number[][] = [];
  const trainTargets: number[][] = [];
  const valInputs: number[][] = [];
  const valTargets: number[][] = [];
  for (let i = 0; i < count; i++) {
    const idx = indices[i];
    if (i < split) {
      trainInputs.push(dataset.inputs[idx]);
      trainTargets.push(dataset.targets[idx]);
    } else {
      valInputs.push(dataset.inputs[idx]);
      valTargets.push(dataset.targets[idx]);
    }
  }
  return {
    train: { inputs: trainInputs, targets: trainTargets },
    validation: { inputs: valInputs, targets: valTargets },
  };
}

function accuracyFor(outputs: number[][], targets: number[][]): number {
  let correct = 0;
  for (let i = 0; i < outputs.length; i++) {
    if (indexOfMax(outputs[i]) === indexOfMax(targets[i])) correct++;
  }
  return outputs.length ? correct / outputs.length : 0;
}

function indexOfMax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function averageGradients(
  batches: Array<{ weights: number[][][]; biases: number[][] }>,
): Array<{ weights: number[][]; biases: number[] }> {
  const count = batches.length;
  const layers = batches[0].weights.length;
  const result: Array<{ weights: number[][]; biases: number[] }> = [];
  for (let l = 0; l < layers; l++) {
    const weights = batches[0].weights[l].map((row) => row.map(() => 0));
    const biases = batches[0].biases[l].map(() => 0);
    for (let k = 0; k < count; k++) {
      const g = batches[k];
      for (let r = 0; r < weights.length; r++) {
        for (let c = 0; c < weights[0].length; c++) {
          weights[r][c] += g.weights[l][r][c] / count;
        }
      }
      for (let bi = 0; bi < biases.length; bi++) {
        biases[bi] += g.biases[l][bi] / count;
      }
    }
    result.push({ weights, biases });
  }
  return result;
}

export class TrainingEngine {
  private status: TrainingStatus = 'idle';
  private abort = false;
  private paused = false;

  getStatus(): TrainingStatus {
    return this.status;
  }

  isTraining(): boolean {
    return this.status === 'training';
  }

  pause(): void {
    if (this.status === 'training') {
      this.status = 'paused';
      this.paused = true;
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.status = 'training';
      this.paused = false;
    }
  }

  stop(): void {
    this.abort = true;
    this.status = 'stopped';
    this.paused = false;
  }

  async train(
    network: NeuralNetwork,
    dataset: Dataset,
    rawConfig: Partial<TrainingConfig>,
    callbacks: TrainCallbacks = {},
  ): Promise<TrainingResult> {
    if (this.status === 'training') {
      throw new Error('Training already in progress');
    }

    const config = resolveConfig(rawConfig);
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    if (dataset.inputs.length === 0) {
      throw new Error('Dataset is empty');
    }
    for (let i = 0; i < dataset.inputs.length; i++) {
      if (dataset.inputs[i].length !== network.inputSize) {
        throw new Error(
          `Sample ${i} has ${dataset.inputs[i].length} inputs, expected ${network.inputSize}`,
        );
      }
      if (dataset.targets[i].length !== network.outputSize) {
        throw new Error(
          `Sample ${i} has ${dataset.targets[i].length} targets, expected ${network.outputSize}`,
        );
      }
    }

    this.abort = false;
    this.status = 'training';
    const start = performance.now();

    const { train, validation } = splitDataset(
      dataset,
      config.validationSplit,
      config.shuffle,
    );

    const optimizer = createOptimizer({
      name: config.optimizer,
      learningRate: config.learningRate,
    });
    const shapes = Array.from({ length: network.layerCount() }, (_, i) => {
      const cfg = network.getLayerConfig(i);
      return { rows: cfg.outputSize, cols: cfg.inputSize, biasCount: cfg.outputSize };
    });
    initOptimizerState(optimizer, network.layerCount(), shapes);

    const history: EpochMetrics[] = [];
    let finalLoss = 0;
    let finalValidationLoss: number | null = null;
    let finalAccuracy: number | null = null;

    const batchSize = Math.min(config.batchSize, train.inputs.length);
    const batchCount = Math.ceil(train.inputs.length / batchSize);

    for (let epoch = 1; epoch <= config.epochs && !this.abort; epoch++) {
      if (this.status === 'stopped') break;

      const order = Array.from({ length: train.inputs.length }, (_, i) => i);
      if (config.shuffle) {
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      }

      for (let b = 0; b < batchCount && !this.abort; b++) {
        while (this.paused) {
          await nextTick();
        }
        if (this.abort) break;

        const startIdx = b * batchSize;
        const endIdx = Math.min(startIdx + batchSize, train.inputs.length);
        const batchGrads: Array<{ weights: number[][][]; biases: number[][] }> = [];

        for (let i = startIdx; i < endIdx; i++) {
          const idx = order[i];
          const result = backpropagate(
            network,
            train.inputs[idx],
            train.targets[idx],
            config.loss,
          );
          batchGrads.push({
            weights: result.gradients.map((g) => g.weights),
            biases: result.gradients.map((g) => g.biases),
          });
        }

        if (batchGrads.length > 0) {
          const avg = averageGradients(batchGrads);
          applyOptimizer(optimizer, network.getLayers(), avg);
          callbacks.onBatch?.(b, batchCount);
        }

        if (b % 4 === 0) {
          await nextTick();
        }
      }

      let totalLoss = 0;
      const trainOutputs: number[][] = [];
      for (let i = 0; i < train.inputs.length; i++) {
        const result = backpropagate(
          network,
          train.inputs[i],
          train.targets[i],
          config.loss,
        );
        totalLoss += result.loss;
        trainOutputs.push(result.output);
      }
      const meanLoss = totalLoss / train.inputs.length;

      let valLoss: number | null = null;
      let accuracy: number | null = null;
      if (validation.inputs.length > 0) {
        let vLoss = 0;
        const valOutputs: number[][] = [];
        for (let i = 0; i < validation.inputs.length; i++) {
          const result = backpropagate(
            network,
            validation.inputs[i],
            validation.targets[i],
            config.loss,
          );
          vLoss += result.loss;
          valOutputs.push(result.output);
        }
        valLoss = vLoss / validation.inputs.length;
        finalValidationLoss = valLoss;
        accuracy = accuracyFor(valOutputs, validation.targets);
        finalAccuracy = accuracy;
      } else {
        accuracy = accuracyFor(trainOutputs, train.targets);
        finalAccuracy = accuracy;
      }

      finalLoss = meanLoss;
      const metrics: EpochMetrics = {
        epoch,
        loss: meanLoss,
        validationLoss: valLoss,
        accuracy,
        durationMs: performance.now() - start,
      };
      history.push(metrics);
      callbacks.onEpoch?.(metrics);

      await nextTick();
    }

    if (this.abort && this.status !== 'paused') {
      this.status = 'stopped';
    } else if (!this.abort) {
      this.status = 'completed';
    }

    return {
      status: this.status,
      epochsCompleted: history.length,
      history,
      finalLoss,
      finalValidationLoss,
      finalAccuracy,
      durationMs: performance.now() - start,
    };
  }
}
