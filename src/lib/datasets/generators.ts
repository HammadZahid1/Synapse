export interface Dataset2D {
  inputs: number[][];
  targets: number[][];
  classes: string[];
  name: string;
  description: string;
}

export interface RegressionDataset {
  inputs: number[][];
  targets: number[][];
  name: string;
  description: string;
}

function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function linearRegressionDataset(options: { count?: number; noise?: number; slope?: number; intercept?: number } = {}): RegressionDataset {
  const count = options.count ?? 100;
  const noise = options.noise ?? 0.1;
  const slope = options.slope ?? 2;
  const intercept = options.intercept ?? 1;
  const inputs: number[][] = [];
  const targets: number[][] = [];
  for (let i = 0; i < count; i++) {
    const x = -1 + (2 * i) / Math.max(1, count - 1);
    const y = slope * x + intercept + (Math.random() - 0.5) * 2 * noise;
    inputs.push([x]);
    targets.push([y]);
  }
  return {
    inputs,
    targets,
    name: 'Linear Regression',
    description: 'Synthetic linear relationship with Gaussian noise.',
  };
}

export function binaryClassificationDataset(options: { count?: number; separation?: number; noise?: number } = {}): Dataset2D {
  const count = options.count ?? 200;
  const separation = options.separation ?? 1.5;
  const noise = options.noise ?? 0.3;
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const half = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    const centerX = i < half ? -separation : separation;
    const centerY = 0;
    const x = centerX + (Math.random() - 0.5) * 2 * noise;
    const y = centerY + (Math.random() - 0.5) * 2 * noise;
    inputs.push([x, y]);
    targets.push([i < half ? 0 : 1]);
  }
  return {
    inputs,
    targets,
    classes: ['Class 0', 'Class 1'],
    name: 'Binary Classification',
    description: 'Two Gaussian clusters with a linear decision boundary.',
  };
}

export function xorDataset(): Dataset2D {
  const inputs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  const targets = [[0], [1], [1], [0]];
  return {
    inputs,
    targets,
    classes: ['0', '1'],
    name: 'XOR',
    description: 'Classic non-linearly separable binary classification problem.',
  };
}

export function gaussianClustersDataset(options: {
  count?: number;
  clusters?: number;
  spread?: number;
} = {}): Dataset2D {
  const count = options.count ?? 400;
  const clusters = options.clusters ?? 4;
  const spread = options.spread ?? 0.5;
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const perCluster = Math.ceil(count / clusters);
  for (let c = 0; c < clusters; c++) {
    const angle = (c / clusters) * Math.PI * 2;
    const cx = Math.cos(angle) * 2;
    const cy = Math.sin(angle) * 2;
    for (let i = 0; i < perCluster && inputs.length < count; i++) {
      inputs.push([cx + (Math.random() - 0.5) * 2 * spread, cy + (Math.random() - 0.5) * 2 * spread]);
      targets.push([c]);
    }
  }
  const classes = clusters.map((c) => `Cluster ${c}`);
  return {
    inputs,
    targets,
    classes,
    name: 'Gaussian Clusters',
    description: 'Multiple Gaussian clusters arranged in a circle.',
  };
}

export function circleDataset(options: { count?: number; noise?: number } = {}): Dataset2D {
  const count = options.count ?? 300;
  const noise = options.noise ?? 0.05;
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const half = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    const r = i < half ? 0.5 + Math.random() * 0.2 : 1.0 + Math.random() * 0.2;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta) + (Math.random() - 0.5) * 2 * noise;
    const y = r * Math.sin(theta) + (Math.random() - 0.5) * 2 * noise;
    inputs.push([x, y]);
    targets.push([i < half ? 0 : 1]);
  }
  return {
    inputs,
    targets,
    classes: ['Inner', 'Outer'],
    name: 'Circles',
    description: 'Concentric circle classification (non-linear boundary).',
  };
}

export function twoMoonsDataset(options: { count?: number; noise?: number } = {}): Dataset2D {
  const count = options.count ?? 300;
  const noise = options.noise ?? 0.05;
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const half = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI;
    const outer = i >= half;
    const dx = outer ? -0.5 : 0.5;
    const x = Math.cos(t) + dx + (Math.random() - 0.5) * 2 * noise;
    const y = Math.sin(t) - (outer ? 0 : 0) + (Math.random() - 0.5) * 2 * noise - (outer ? 0 : 0);
    const yBase = Math.sin(t) - (outer ? 0 : 0);
    inputs.push([x, yBase + (Math.random() - 0.5) * 2 * noise]);
    targets.push([outer ? 1 : 0]);
  }
  return {
    inputs,
    targets,
    classes: ['Moon 0', 'Moon 1'],
    name: 'Two Moons',
    description: 'Two interleaving crescent-shaped classes.',
  };
}

export function spiralDataset(options: { count?: number; turns?: number; noise?: number } = {}): Dataset2D {
  const count = options.count ?? 400;
  const turns = options.turns ?? 3;
  const noise = options.noise ?? 0.1;
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const perClass = Math.floor(count / 2);
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < perClass; i++) {
      const r = i / perClass;
      const theta = r * turns * Math.PI + (c === 0 ? 0 : Math.PI);
      const x = r * Math.cos(theta) + (Math.random() - 0.5) * 2 * noise;
      const y = r * Math.sin(theta) + (Math.random() - 0.5) * 2 * noise;
      inputs.push([x, y]);
      targets.push([c]);
    }
  }
  return {
    inputs,
    targets,
    classes: ['Spiral 0', 'Spiral 1'],
    name: 'Spiral',
    description: 'Two intertwined spiral classification problem.',
  };
}

export function allDatasets(): Array<{ id: string; generate: () => Dataset2D | RegressionDataset; name: string; description: string; type: 'classification' | 'regression' }> {
  return [
    { id: 'xor', generate: () => xorDataset(), name: 'XOR', description: 'Classic non-linearly separable problem.', type: 'classification' },
    { id: 'linear', generate: () => linearRegressionDataset(), name: 'Linear Regression', description: 'Linear relationship with noise.', type: 'regression' },
    { id: 'binary', generate: () => binaryClassificationDataset(), name: 'Binary Classification', description: 'Two separable Gaussian clusters.', type: 'classification' },
    { id: 'clusters', generate: () => gaussianClustersDataset(), name: 'Gaussian Clusters', description: 'Multi-cluster classification.', type: 'classification' },
    { id: 'circles', generate: () => circleDataset(), name: 'Circles', description: 'Concentric circles.', type: 'classification' },
    { id: 'moons', generate: () => twoMoonsDataset(), name: 'Two Moons', description: 'Interleaving crescents.', type: 'classification' },
    { id: 'spiral', generate: () => spiralDataset(), name: 'Spiral', description: 'Intertwined spirals.', type: 'classification' },
  ];
}
