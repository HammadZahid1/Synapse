import * as React from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader } from '@/components/ui/panel';
import { Play, Stop, RotateCw, Eraser, RotateCcw } from 'lucide-react';

const CANVAS_SIZE = 280;
const DIGIT_SIZE = 28;

interface Stroke {
  points: { x: number; y: number }[];
  width: number;
  erase: boolean;
}

export function DigitRecognitionPage() {
  const network = useNetworkStore((s) => s.network);
  const {
    status,
    startTraining,
    stopTraining,
    resetTraining,
  } = useTrainingStore();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [strokeWidth, setStrokeWidth] = React.useState(8);
  const [isEraser, setIsEraser] = React.useState(false);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [prediction, setPrediction] = React.useState<number | null>(null);
  const [confidences, setConfidences] = React.useState<number[] | null>(null);
  const [modelTrained, setModelTrained] = React.useState(false);

  const [isActive, setIsActive] = React.useState(false);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pt = getPoint(e);
    if (!pt) return;
    const stroke: Stroke = { points: [pt], width: strokeWidth, erase: isEraser };
    setStrokes((prev) => [...prev, stroke]);
    setIsActive(true);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pt = getPoint(e);
    if (!pt) return;
    setStrokes((prev) => {
      const last = [...prev];
      last[last.length - 1].points.push(pt);
      return last;
    });
  };

  const endDraw = () => setIsDrawing(false);

  const getPoint = (
    e: React.MouseEvent | React.TouchEvent,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY =
      'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_SIZE;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_SIZE;
    return { x, y };
  };

  const clearCanvas = () => {
    setStrokes([]);
    setPrediction(null);
    setConfidences(null);
    setIsActive(false);
  };

  const undoStroke = () => {
    setStrokes((prev) => prev.slice(0, -1));
    setPrediction(null);
    setConfidences(null);
  };

  const normalize = (): number[] => {
    const offscreen = new OffscreenCanvas(CANVAS_SIZE, CANVAS_SIZE);
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach((s) => {
      ctx.beginPath();
      ctx.strokeStyle = s.erase ? '#050505' : '#ffffff';
      ctx.lineWidth = s.width;
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    });

    const img = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = img.data;
    let minX = CANVAS_SIZE,
      minY = CANVAS_SIZE,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const a = data[(y * CANVAS_SIZE + x) * 4 + 3];
        if (a > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX) {
      return new Array(DIGIT_SIZE * DIGIT_SIZE).fill(0);
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const scale = 20 / Math.max(w, h);
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const dx = Math.round((CANVAS_SIZE - tw) / 2);
    const dy = Math.round((CANVAS_SIZE - th) / 2);

    const out = new Array(DIGIT_SIZE * DIGIT_SIZE).fill(0);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const sx = minX + (x / tw) * w;
        const sy = minY + (y / th) * h;
        const sx0 = Math.floor(sx);
        const sy0 = Math.floor(sy);
        const idx = (sy0 * CANVAS_SIZE + sx0) * 4 + 3;
        const val = data[idx] / 255;
        out[(dy + y) * DIGIT_SIZE + (dx + x)] = val;
      }
    }
    return out;
  };

  const predict = () => {
    const net = useNetworkStore.getState().network;
    if (!net) return;
    const input = normalize();
    const output = net.predict(input);
    const confidences = softmax(output);
    const pred = indexOfMax(confidences);
    setPrediction(pred);
    setConfidences(confidences);
    setIsActive(false);
  };

  const trainSynthetic = async () => {
    if (!network) return;
    useNetworkStore.getState().loadPreset({
      inputSize: 784,
      outputSize: 10,
      hiddenLayers: [
        { size: 64, activation: 'relu' },
        { size: 32, activation: 'relu' },
      ],
      outputActivation: 'softmax',
      weightInit: 'he',
    });
    const dataset = generateSyntheticDigits();
    try {
      await startTraining(dataset, {
        epochs: 20,
        learningRate: 0.5,
        batchSize: 16,
        optimizer: 'adam',
        loss: 'categorical-cross-entropy',
        validationSplit: 0.15,
        shuffle: true,
      });
      setModelTrained(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <Panel className="flex flex-col h-[640px]">
          <PanelHeader>
            <PanelTitle>Drawing Canvas</PanelTitle>
            <PanelDescription>
              Draw a digit and classify it with the local network.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 flex flex-col items-center gap-4 min-h-0 relative">
            <div className="relative border border-synapse-border bg-synapse-secondary rounded overflow-hidden">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startDraw(e as unknown as React.TouchEvent);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  moveDraw(e as unknown as React.TouchEvent);
                }}
                onTouchEnd={endDraw}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[10px] text-synapse-muted">
                Stroke width
              </label>
              <input
                type="range"
                min="2"
                max="24"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="accent-cyan-500"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEraser((v) => !v)}
                active={isEraser}
                title="Eraser"
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={undoStroke}>
                <RotateCcw className="h-4 w-4" /> Undo
              </Button>
              <Button variant="destructive" size="sm" onClick={clearCanvas}>
                Clear
              </Button>
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Model</PanelTitle>
            <PanelDescription>
              Locally trained digit classifier (784 → 64 → 32 → 10).
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <div className="text-xs text-synapse-muted">
              {network ? `${network.totalParameters()} parameters` : 'No network'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={modelTrained ? 'outline' : 'outline'}
                onClick={trainSynthetic}
                disabled={status === 'training'}
                className="w-full text-xs"
                title="Train on locally generated synthetic digit samples"
              >
                Train on synthetic digits
              </Button>
              <Button
                variant="outline"
                onClick={() => useNetworkStore.getState().reset()}
                className="w-full text-xs"
              >
                Reset network
              </Button>
            </div>
            <p className="text-xs text-synapse-muted">
              Training uses a locally generated dataset — no external data.
            </p>
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <Panel className="flex flex-col h-[300px]">
          <PanelHeader>
            <PanelTitle>Prediction</PanelTitle>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0 flex flex-col items-center justify-center">
            {prediction === null ? (
              <div className="text-synapse-muted text-xs">
                Draw a digit, then predict
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-cyan-500">
                  {prediction}
                </div>
                {confidences && (
                  <div className="text-xs text-synapse-muted mt-2">
                    Confidence: {(confidences[prediction] * 100).toFixed(1)}%
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs">
                  {confidences
                    ? confidences.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-8 text-[10px] text-synapse-muted text-right">
                            {i}
                          </span>
                          <div className="flex-1 h-2 bg-synapse-border rounded overflow-hidden">
                            <div
                              className="h-full bg-cyan-400"
                              style={{ width: `${(c * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <span className="w-10 text-[10px] font-mono text-synapse-ink">
                            {(c * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            )}
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col h-[300px]">
          <PanelHeader>
            <PanelTitle>Normalized Input (28×28)</PanelTitle>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0 flex items-center justify-center">
            <DigitPreview input={normalize()} />
          </PanelContent>
        </Panel>

        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={!network || status === 'training'}
            onClick={predict}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" /> Predict
          </Button>
          {status === 'training' && (
            <Button variant="destructive" onClick={stopTraining} className="w-full">
              <Stop className="h-4 w-4 mr-2" /> Stop training
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function indexOfMax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

function softmax(values: number[]): number[] {
  let max = -Infinity;
  for (const v of values) if (v > max) max = v;
  let sum = 0;
  const out = new Array(values.length);
  for (let i = 0; i < values.length; i++) {
    out[i] = Math.exp(values[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

function DigitPreview({ input }: { input: number[] }) {
  const cell = 8;
  return (
    <div className="flex items-center justify-center gap-1">
      {input.map((v, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            width: cell,
            height: cell,
            backgroundColor: `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`,
          }}
        />
      ))}
    </div>
  );
}

function generateSyntheticDigits() {
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const samplesPerDigit = 40;
  for (let d = 0; d < 10; d++) {
    for (let s = 0; s < samplesPerDigit; s++) {
      const img = new Array(28 * 28).fill(0);
      const cx = 6 + Math.random() * 16;
      const cy = 6 + Math.random() * 16;
      const r = 2 + Math.random() * 3;
      const noise = 0.15;
      switch (d) {
        case 0: // circle
          for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
              const ddx = (x - cx) / r;
              const ddy = (y - cy) / r;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (Math.abs(dist - 1) < 0.25) img[y * 28 + x] = 1;
            }
          }
          break;
        case 1: // vertical line
          for (let y = 0; y < 28; y++) {
            img[y * 28 + Math.floor(cx)] = 1;
          }
          break;
        default: // random blob
          for (let i = 0; i < 60; i++) {
            const x = Math.floor(cx + (Math.random() - 0.5) * 8);
            const y = Math.floor(cy + (Math.random() - 0.5) * 8);
            if (x >= 0 && x < 28 && y >= 0 && y < 28) img[y * 28 + x] = 1;
          }
      }
      for (let i = 0; i < img.length; i++) {
        if (Math.random() < noise) img[i] = 1 - img[i];
      }
      inputs.push(img);
      const t = new Array(10).fill(0);
      t[d] = 1;
      targets.push(t);
    }
  }
  return { inputs, targets };
}
