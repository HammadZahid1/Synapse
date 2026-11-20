export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDataset(
  inputs: number[][],
  targets: number[][],
  expectedInputSize?: number,
  expectedOutputSize?: number,
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(inputs) || inputs.length === 0) {
    errors.push('Dataset inputs must be a non-empty array');
    return { valid: false, errors };
  }
  if (!Array.isArray(targets) || targets.length === 0) {
    errors.push('Dataset targets must be a non-empty array');
    return { valid: false, errors };
  }
  if (inputs.length !== targets.length) {
    errors.push(`Input count (${inputs.length}) does not match target count (${targets.length})`);
  }

  let inputSize: number | null = null;
  for (let i = 0; i < inputs.length; i++) {
    const row = inputs[i];
    if (!Array.isArray(row)) {
      errors.push(`Input ${i} is not an array`);
      continue;
    }
    if (inputSize === null) inputSize = row.length;
    else if (row.length !== inputSize) {
      errors.push(`Input ${i} has ${row.length} features, expected ${inputSize}`);
    }
    for (let j = 0; j < row.length; j++) {
      if (!Number.isFinite(row[j])) {
        errors.push(`Input ${i}[${j}] is not a finite number`);
      }
    }
  }

  let outputSize: number | null = null;
  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    if (!Array.isArray(row)) {
      errors.push(`Target ${i} is not an array`);
      continue;
    }
    if (outputSize === null) outputSize = row.length;
    else if (row.length !== outputSize) {
      errors.push(`Target ${i} has ${row.length} values, expected ${outputSize}`);
    }
    for (let j = 0; j < row.length; j++) {
      if (!Number.isFinite(row[j])) {
        errors.push(`Target ${i}[${j}] is not a finite number`);
      }
    }
  }

  if (expectedInputSize != null && inputSize !== expectedInputSize) {
    errors.push(`Expected ${expectedInputSize} inputs, found ${inputSize}`);
  }
  if (expectedOutputSize != null && outputSize !== expectedOutputSize) {
    errors.push(`Expected ${expectedOutputSize} outputs, found ${outputSize}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateNetworkConfiguration(
  inputSize: number,
  outputSize: number,
  hiddenLayers: Array<{ size: number }>,
): ValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(inputSize) || inputSize <= 0) errors.push('inputSize must be a positive integer');
  if (!Number.isInteger(outputSize) || outputSize <= 0) errors.push('outputSize must be a positive integer');
  if (!Array.isArray(hiddenLayers)) errors.push('hiddenLayers must be an array');
  else {
    for (let i = 0; i < hiddenLayers.length; i++) {
      const layer = hiddenLayers[i];
      if (!Number.isInteger(layer.size) || layer.size <= 0) {
        errors.push(`Hidden layer ${i} size must be a positive integer`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateTrainingConfiguration(config: {
  epochs?: number;
  learningRate?: number;
  batchSize?: number;
  validationSplit?: number;
}): ValidationResult {
  const errors: string[] = [];
  if (config.epochs != null && (!Number.isInteger(config.epochs) || config.epochs <= 0)) {
    errors.push('epochs must be a positive integer');
  }
  if (config.learningRate != null && (!Number.isFinite(config.learningRate) || config.learningRate <= 0)) {
    errors.push('learningRate must be a positive number');
  }
  if (config.batchSize != null && (!Number.isInteger(config.batchSize) || config.batchSize <= 0)) {
    errors.push('batchSize must be a positive integer');
  }
  if (config.validationSplit != null && (config.validationSplit < 0 || config.validationSplit >= 1)) {
    errors.push('validationSplit must be between 0 and 1');
  }
  return { valid: errors.length === 0, errors };
}
