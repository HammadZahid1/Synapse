export type Matrix = number[][];

export function createMatrix(rows: number, cols: number, value = 0): Matrix {
  const data: Matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    data[i] = new Array(cols).fill(value);
  }
  return data;
}

export function zeros(rows: number, cols: number): Matrix {
  return createMatrix(rows, cols, 0);
}

export function ones(rows: number, cols: number): Matrix {
  return createMatrix(rows, cols, 1);
}

export function randomMatrix(
  rows: number,
  cols: number,
  min = 0,
  max = 1,
): Matrix {
  const data: Matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    data[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      data[i][j] = min + Math.random() * (max - min);
    }
  }
  return data;
}

export function copy(matrix: Matrix): Matrix {
  return matrix.map((row) => row.slice());
}

export function add(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = a[0].length;
  const result: Matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    result[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      result[i][j] = a[i][j] + b[i][j];
    }
  }
  return result;
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = a[0].length;
  const result: Matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    result[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      result[i][j] = a[i][j] - b[i][j];
    }
  }
  return result;
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = a[0].length;
  const result: Matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    result[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      result[i][j] = a[i][j] * b[i][j];
    }
  }
  return result;
}

export function scale(matrix: Matrix, scalar: number): Matrix {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Matrix = new Array(rows);
  for (let i = 0; i < rows; i++) {
    result[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      result[i][j] = matrix[i][j] * scalar;
    }
  }
  return result;
}

export function map(matrix: Matrix, fn: (value: number) => number): Matrix {
  return matrix.map((row) => row.map(fn));
}

export function dot(a: Matrix, b: Matrix): Matrix {
  const aRows = a.length;
  const aCols = a[0].length;
  const bCols = b[0].length;
  const result: Matrix = new Array(aRows);
  for (let i = 0; i < aRows; i++) {
    result[i] = new Array(bCols);
    for (let k = 0; k < bCols; k++) {
      let sum = 0;
      for (let j = 0; j < aCols; j++) {
        sum += a[i][j] * b[j][k];
      }
      result[i][k] = sum;
    }
  }
  return result;
}

export function transpose(matrix: Matrix): Matrix {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: Matrix = new Array(cols);
  for (let j = 0; j < cols; j++) {
    result[j] = new Array(rows);
    for (let i = 0; i < rows; i++) {
      result[j][i] = matrix[i][j];
    }
  }
  return result;
}

export function rowVector(values: number[]): Matrix {
  return [values];
}

export function columnVector(values: number[]): Matrix {
  return values.map((v) => [v]);
}

export function flatten(matrix: Matrix): number[] {
  const result: number[] = [];
  for (const row of matrix) {
    result.push(...row);
  }
  return result;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function variance(values: number[]): number {
  const m = mean(values);
  let sum = 0;
  for (const v of values) sum += (v - m) ** 2;
  return sum / values.length;
}

export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function min(values: number[]): number {
  let result = Infinity;
  for (const v of values) if (v < result) result = v;
  return result === Infinity ? 0 : result;
}

export function max(values: number[]): number {
  let result = -Infinity;
  for (const v of values) if (v > result) result = v;
  return result === -Infinity ? 0 : result;
}

export function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sigmoidDerivativeFromOutput(output: number): number {
  return output * (1 - output);
}

export function stableSoftmax(values: number[]): number[] {
  let maxVal = -Infinity;
  for (const v of values) if (v > maxVal) maxVal = v;
  let sum = 0;
  const result = new Array(values.length);
  for (let i = 0; i < values.length; i++) {
    result[i] = Math.exp(values[i] - maxVal);
    sum += result[i];
  }
  for (let i = 0; i < result.length; i++) result[i] /= sum;
  return result;
}
