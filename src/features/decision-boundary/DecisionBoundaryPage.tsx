import * as React from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';
import { Play, Stop, RotateCw } from 'lucide-react';
import { allDatasets } from '@/lib/datasets/generators';

const GRID = 160;
const RANGE = 2.2;

export function DecisionBoundaryPage() {
  const { network, loadPreset } = useNetworkStore();
  const {
    status,
    history,
    startTraining,
    stopTraining,
    resetTraining,
  } = useTrainingStore();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [datasetId, setDatasetId] = React.useState<string>('xor');
  const [hiddenSize, setHiddenSize] = React.useState(8);
  const [epochs, setEpochs] = React.useState(300);
  const [learningRate, setLearningRate] = React.useState(0.5);
  const [boundary, setBoundary] = React.useState<{
    data: ImageData;
    bounds: [number, number, number, number];
  } | null>(null);
  const [hover, setHover] = React.useState<{ x: number; y: number; pred: number } | null>(null);

  const datasets = allDatasets();
  const selectedDataset = datasets.find((d) => d.id === datasetId);
  const ds = selectedDataset ? selectedDataset.generate() : null;

  const drawPoints = (ctx: CanvasRenderingContext2D) => {
    if (!ds) return;
    const size = GRID;
    ds.inputs.forEach((p, i) => {
      const cls = ds!.targets[i][0];
      const px = ((p[0] + RANGE) / (2 * RANGE)) * size;
      const py = ((RANGE - p[1]) / (2 * RANGE)) * size;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = cls > 0.5 ? '#a855f7' : '#00f3ff';
      ctx.fill();
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (hover && hover.x === p[0] && hover.y === p[1]) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    });
  };

  const computeBoundary = () => {
    if (!network || !ds) return;
    // Configure network for 2D binary classification
    loadPreset({
      inputSize: 2,
      outputSize: 1,
      hiddenLayers: [{ size: hiddenSize, activation: 'tanh' }],
      outputActivation: 'sigmoid',
      weightInit: 'xavier',
    });
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = GRID;
    const canvas = canvasRef.current!;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const img = ctx.createImageData(size, size);
    const step = (2 * RANGE) / size;
    let idx = 0;
    for (let y = 0; y < size; y++) {
      const py = RANGE - y * step;
      for (let x = 0; x < size; x++) {
        const px = -RANGE + x * step;
        const [pred] = network.predict([px, py]);
        const c = classColor(pred);
        img.data[idx++] = c[0];
        img.data[idx++] = c[1];
        img.data[idx++] = c[2];
        img.data[idx++] = c[3];
      }
    }
    ctx.putImageData(img, 0, 0);
    drawPoints(ctx);
    setBoundary({ data: img, bounds: [-RANGE, RANGE, -RANGE, RANGE] });
  };

  React.useEffect(() => {
    if (!ds || !network) return;
    computeBoundary();
  }, [ds, datasetId, network, hiddenSize]);

  const handleTrain = async () => {
    if (!network || !ds) return;
    try {
      await startTraining(ds, {
        epochs,
        learningRate,
        batchSize: 4,
        optimizer: 'sgd',
        loss: 'binary-cross-entropy',
        validationSplit: 0,
        shuffle: true,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  React.useEffect(() => {
    if (status === 'completed' || status === 'stopped') {
      computeBoundary();
    }
  }, [status, network, ds]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !boundary) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = ((e.clientX - rect.left) * dpr) / GRID;
    const y = ((e.clientY - rect.top) * dpr) / GRID;
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) {
      setHover(null);
      return;
    }
    const px = -RANGE + x * ((2 * RANGE) / GRID);
    const py = RANGE - y * ((2 * RANGE) / GRID);
    const [pred] = network.predict([px, py]);
    setHover({ x: px, y: py, pred });
  };

  const handleLeave = () => setHover(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <Panel className="flex flex-col h-[640px]">
          <PanelHeader>
            <PanelTitle>Decision Boundary</PanelTitle>
            <PanelDescription>
              Model predictions across the 2D feature space.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0 relative">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleLeave}
              width={GRID}
              height={GRID}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {!boundary && (
                <div className="text-xs text-synapse-muted">
                  Configure and train to see the boundary
                </div>
              )}
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-synapse-muted px-2">
              <span>x₁: {hover?.x.toFixed(2) ?? '—'}</span>
              <span>x₂: {hover?.y.toFixed(2) ?? '—'}</span>
              <span>pred: {hover?.pred.toFixed(3) ?? '—'}</span>
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Dataset</PanelTitle>
            <PanelDescription>2D classification datasets.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {datasets.filter((d) => d.type === 'classification').map((ds) => (
              <Button
                key={ds.id}
                variant={datasetId === ds.id ? 'cyan' : 'outline'}
                onClick={() => setDatasetId(ds.id)}
                className="w-full justify-start text-xs gap-3"
              >
                <span>{ds.name}</span>
                <span className="ml-auto text-[10px] text-synapse-muted">
                  {ds.inputs ? String(ds.inputs.length) + ' pts' : ''}
                </span>
              </Button>
            ))}
            <p className="text-xs text-synapse-muted">
              Datasets are generated locally in the browser.
            </p>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Training</PanelTitle>
            <PanelDescription>Train on the selected dataset.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <Field
              label="Hidden neurons"
              value={hiddenSize}
              onChange={(v) => setHiddenSize(v)}
            />
            <Field label="Epochs" value={epochs} onChange={(v) => setEpochs(v)} />
            <Field
              label="Learning rate"
              value={learningRate}
              step="0.01"
              onChange={(v) => setLearningRate(v)}
            />
            <div className="grid grid-cols-2 gap-2">
              {status === 'idle' && (
                <Button onClick={handleTrain} className="w-full">
                  <Play className="h-4 w-4 mr-2" /> Train
                </Button>
              )}
              {status === 'training' && (
                <Button variant="destructive" onClick={stopTraining} className="w-full">
                  <Stop className="h-4 w-4 mr-2" /> Stop
                </Button>
              )}
              {(status === 'completed' || status === 'stopped') && (
                <>
                  <Button variant="outline" onClick={resetTraining} className="w-full">
                    <RotateCw className="h-4 w-4 mr-2" /> Reset
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-synapse-muted">
              Boundary recomputes when training finishes.
            </p>
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <Panel className="flex flex-col h-[300px]">
          <PanelHeader>
            <PanelTitle>Training History</PanelTitle>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0">
            {history.length === 0 ? (
              <p className="text-xs text-synapse-muted text-center py-8">
                No training run yet.
              </p>
            ) : (
              <div className="space-y-2">
                {history.slice(-20).map((m) => (
                  <div key={m.epoch} className="flex justify-between text-xs border-b border-synapse-border pb-1">
                    <span className="text-synapse-muted">Epoch {m.epoch}</span>
                    <span className="font-mono text-synapse-ink">
                      loss {m.loss.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>How it works</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <p className="text-xs text-synapse-muted mb-3">
              The background shows the network's predicted class across a
              {GRID}×{GRID} grid of the feature space, computed with real
              forward passes. Points are the actual dataset samples colored by
              their true class.
            </p>
            <p className="text-xs text-synapse-muted">
              Hover a point or position to inspect the live prediction.
            </p>
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-synapse-muted">{label}</label>
      <input
        type="number"
        step={step}
        value={String(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
      />
    </div>
  );
}

function classColor(pred: number): [number, number, number, number] {
  const confidence = Math.abs(pred - 0.5) * 2;
  const base = pred > 0.5 ? [168, 85, 247] : [0, 243, 255];
  const alpha = 0.35 + 0.6 * confidence;
  return [...base, alpha * 255] as [number, number, number, number];
}
