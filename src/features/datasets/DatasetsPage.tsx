import * as React from 'react';
import { useNavigate } from '@/app/router';
import {
  allDatasets,
  xorDataset,
  linearRegressionDataset,
  binaryClassificationDataset,
  gaussianClustersDataset,
  circleDataset,
  twoMoonsDataset,
  spiralDataset,
  type Dataset2D,
  type RegressionDataset,
} from '@/lib/datasets/generators';
import { validateDataset } from '@/lib/datasets/validation';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader } from '@/components/ui/panel';

const generators: Record<string, (opts?: any) => Dataset2D | RegressionDataset> = {
  xor: () => xorDataset(),
  linear: (opts) => linearRegressionDataset(opts),
  binary: (opts) => binaryClassificationDataset(opts),
  clusters: (opts) => gaussianClustersDataset(opts),
  circles: (opts) => circleDataset(opts),
  moons: (opts) => twoMoonsDataset(opts),
  spiral: (opts) => spiralDataset(opts),
};

export function DatasetsPage() {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = React.useState<string>('xor');
  const [sampleCount, setSampleCount] = React.useState(200);
  const [noise, setNoise] = React.useState(0.15);
  const [spread, setSpread] = React.useState(0.5);
  const [trainRatio, setTrainRatio] = React.useState(0.7);
  const [valRatio, setValRatio] = React.useState(0.15);

  const selected = allDatasets().find((d) => d.id === datasetId)!;
  const isRegression = selected.type === 'regression';

  const [raw, setRaw] = React.useState<Dataset2D | RegressionDataset | null>(null);
  const [validation, setValidation] = React.useState<{ valid: boolean; errors: string[] } | null>(null);

  React.useEffect(() => {
    regenerate();
  }, [datasetId, sampleCount, noise, spread]);

  const regenerate = () => {
    const gen = generators[datasetId];
    let ds: Dataset2D | RegressionDataset;
    if (datasetId === 'linear') {
      ds = gen({ count: sampleCount, noise });
    } else if (datasetId === 'binary') {
      ds = gen({ count: sampleCount, separation: 1.5, noise });
    } else if (datasetId === 'clusters') {
      ds = gen({ count: sampleCount, clusters: 4, spread });
    } else if (['circles', 'moons', 'spiral'].includes(datasetId)) {
      ds = gen({ count: sampleCount, noise });
    } else {
      ds = gen();
    }
    setRaw(ds);
    setValidation(validateDataset(ds.inputs, ds.targets));
  };

  const ds = raw as Dataset2D | null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Dataset</PanelTitle>
            <PanelDescription>Select and configure a dataset.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {allDatasets().map((d) => (
              <Button
                key={d.id}
                variant={datasetId === d.id ? 'cyan' : 'outline'}
                onClick={() => setDatasetId(d.id)}
                className="w-full justify-start text-xs gap-3"
              >
                <span>{d.name}</span>
                <span className="ml-auto text-[10px] text-synapse-muted">{d.type}</span>
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={regenerate} className="w-full">
              Regenerate (new random seed)
            </Button>
          </PanelContent>
        </Panel>

        {!isRegression && (
          <Panel className="flex flex-col">
            <PanelHeader>
              <PanelTitle>Generation controls</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <LabeledRange label="Sample count" value={sampleCount} min="50" max="1000" step="10" onChange={setSampleCount} />
              <LabeledRange label="Noise" value={noise} min="0" max="1" step="0.05" onChange={setNoise} />
              {datasetId === 'clusters' && (
                <LabeledRange label="Spread" value={spread} min="0.1" max="2" step="0.1" onChange={setSpread} />
              )}
            </PanelContent>
          </Panel>
        )}
        {isRegression && (
          <Panel className="flex flex-col">
            <PanelHeader>
              <PanelTitle>Generation controls</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <LabeledRange label="Sample count" value={sampleCount} min="50" max="1000" step="10" onChange={setSampleCount} />
              <LabeledRange label="Noise" value={noise} min="0" max="1" step="0.05" onChange={setNoise} />
            </PanelContent>
          </Panel>
        )}

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Splits</PanelTitle>
            <PanelDescription>Train / validation / test.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <LabeledRange label="Train" value={trainRatio} min="0.5" max="0.9" step="0.05" onChange={setTrainRatio} />
            <LabeledRange label="Validation" value={valRatio} min="0" max="0.4" step="0.05" onChange={setValRatio} />
            <div className="text-xs text-synapse-muted">
              Test: {Math.max(0, 1 - trainRatio - valRatio).toFixed(0) === 0 ? '0%' : ((1 - trainRatio - valRatio) * 100).toFixed(0) + '%'}
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Actions</PanelTitle>
          </PanelHeader>
          <PanelContent className="space-y-2">
            <Button onClick={() => navigate('/training-lab')} className="w-full">
              Open Training Lab
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full">
              Export dataset JSON
            </Button>
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-8 space-y-4">
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Preview</PanelTitle>
            <PanelDescription>{selected.description}</PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0">
            {validation && !validation.valid ? (
              <div className="p-3 border border-red-500/30 bg-red-500/10 rounded text-xs text-red-400">
                {validation.errors.join('\n')}
              </div>
            ) : null}
            <DatasetPreview data={ds} isRegression={isRegression} />
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Schema</PanelTitle>
          </PanelHeader>
          <PanelContent className="space-y-2">
            <div className="text-xs text-synapse-muted">
              Type: <span className="text-synapse-ink font-mono">{selected.type}</span>
            </div>
            {ds ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-synapse-muted">Samples</span>
                  <span className="font-mono text-synapse-ink">{ds.inputs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-synapse-muted">Input size</span>
                  <span className="font-mono text-synapse-ink">{ds.inputs[0].length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-synapse-muted">Target size</span>
                  <span className="font-mono text-synapse-ink">{ds.targets[0].length}</span>
                </div>
                {'classes' in ds && (
                  <div>
                    <span className="text-synapse-muted block mt-1">Classes</span>
                    <div className="flex gap-1">
                      {(ds as Dataset2D).classes.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded border border-synapse-border text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}

function LabeledRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-synapse-muted">{label}</span>
        <span className="font-mono text-synapse-ink">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={String(min)}
        max={String(max)}
        step={String(step)}
        value={String(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-cyan-500"
      />
    </div>
  );
}

function DatasetPreview({
  data,
  isRegression,
}: {
  data: Dataset2D | RegressionDataset | null;
  isRegression: boolean;
}) {
  if (!data) return <div className="text-xs text-synapse-muted text-center py-8">No data</div>;
  if (data.inputs[0].length !== 2) {
    return (
      <div className="text-xs text-synapse-muted text-center py-8">
        Preview only supports 2D datasets ({data.inputs[0].length} features)
      </div>
    );
  }
  return <ScatterCanvas points={data.inputs} targets={data.targets} isRegression={isRegression} />;
}

function handleExport() {
  // Wired into the export system (Phase 19)
}

function indexOfMax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

function ScatterCanvas({
  points,
  targets,
  isRegression,
}: {
  points: number[][];
  targets: number[][];
  isRegression: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const cssW = 300;
    const cssH = 300;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const minX = Math.min(...xs) - 0.3;
    const maxX = Math.max(...xs) + 0.3;
    const minY = Math.min(...ys) - 0.3;
    const maxY = Math.max(...ys) + 0.3;
    const mapX = (x: number) => ((x - minX) / (maxX - minX)) * cssW;
    const mapY = (y: number) => cssH - ((y - minY) / (maxY - minY)) * cssH;

    // axes
    ctx.strokeStyle = '#16181e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mapX(minX), 0);
    ctx.lineTo(mapX(minX), cssH);
    ctx.moveTo(0, mapY(minY));
    ctx.lineTo(cssW, mapY(minY));
    ctx.stroke();

    points.forEach((p, i) => {
      const cls = isRegression ? 0 : indexOfMax(targets[i]);
      ctx.beginPath();
      ctx.arc(mapX(p[0]), mapY(p[1]), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cls > 0.5 ? '#a855f7' : '#00f3ff';
      ctx.fill();
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [points, targets, isRegression]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="border border-synapse-border bg-synapse-secondary"
    />
  );
}
