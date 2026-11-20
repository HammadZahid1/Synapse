import * as React from 'react';
import { useNavigate } from '@/app/routerHooks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';
import { useTrainingStore } from '@/stores/trainingStore';
import { useNetworkStore } from '@/stores/networkStore';
import { allDatasets } from '@/lib/datasets/generators';
import { Play, Pause, Stop, RotateCw } from 'lucide-react';

type OptimizerOption = 'sgd' | 'momentum' | 'adam';
type LossOption = 'mse' | 'binary-cross-entropy' | 'categorical-cross-entropy';

export function TrainingLabPage() {
  const navigate = useNavigate();
  const network = useNetworkStore((s) => s.network);
  const {
    status,
    history,
    currentEpoch,
    loss,
    validationLoss,
    accuracy,
    durationMs,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
    resetTraining,
  } = useTrainingStore();

  const [datasetId, setDatasetId] = React.useState<string>('xor');
  const [config, setConfig] = React.useState<{
    epochs: number;
    learningRate: number;
    batchSize: number;
    optimizer: OptimizerOption;
    loss: LossOption;
    validationSplit: number;
    shuffle: boolean;
  }>({
    epochs: 200,
    learningRate: 0.1,
    batchSize: 1,
    optimizer: 'sgd',
    loss: 'mse',
    validationSplit: 0.2,
    shuffle: true,
  });

  const datasets = allDatasets();
  const selectedDataset = datasets.find((d) => d.id === datasetId);

  const handleStart = async () => {
    if (!network) return;
    if (!selectedDataset) return;
    const ds = selectedDataset.generate();
    try {
      await startTraining(ds, config);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const latest = history.length ? history[history.length - 1] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Dataset</PanelTitle>
            <PanelDescription>Choose the dataset to train on.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {datasets.map((ds) => (
              <Button
                key={ds.id}
                variant={datasetId === ds.id ? 'cyan' : 'outline'}
                onClick={() => setDatasetId(ds.id)}
                className="w-full justify-start text-xs gap-3"
              >
                <span>{ds.name}</span>
                <span className="ml-auto text-[10px] text-synapse-muted">
                  {ds.type}
                </span>
              </Button>
            ))}
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Training Configuration</PanelTitle>
            <PanelDescription>All controls drive the local training engine.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-4">
            <Field label="Epochs" value={config.epochs} onChange={(v) => setConfig({ ...config, epochs: v })} />
            <Field label="Learning rate" value={config.learningRate} step="0.01" onChange={(v) => setConfig({ ...config, learningRate: v })} />
            <Field label="Batch size" value={config.batchSize} onChange={(v) => setConfig({ ...config, batchSize: v })} />
            <Field label="Validation split" value={config.validationSplit} step="0.1" min="0" max="0.9" onChange={(v) => setConfig({ ...config, validationSplit: v })} />
            <Field label="Optimizer" type="select" value={config.optimizer} onChange={(v) => setConfig({ ...config, optimizer: v as OptimizerOption })}>
              <option value="sgd">SGD</option>
              <option value="momentum">Momentum SGD</option>
              <option value="adam">Adam</option>
            </Field>
            <Field label="Loss function" type="select" value={config.loss} onChange={(v) => setConfig({ ...config, loss: v as LossOption })}>
              <option value="mse">Mean squared error</option>
              <option value="binary-cross-entropy">Binary cross-entropy</option>
              <option value="categorical-cross-entropy">Categorical cross-entropy</option>
            </Field>
            <Field label="Shuffle" type="checkbox" checked={config.shuffle} onChange={(v) => setConfig({ ...config, shuffle: v })} />
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Actions</PanelTitle>
            <PanelDescription>Start, pause, resume, or stop training.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {!network && (
              <Button variant="outline" disabled className="w-full">
                Initialize a network first
              </Button>
            )}
            {network && status === 'idle' && (
              <Button onClick={handleStart} className="w-full">
                <Play className="h-4 w-4 mr-2" /> Start training
              </Button>
            )}
            {status === 'training' && (
              <>
                <Button variant="violet" onClick={pauseTraining} className="w-full">
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
                <Button variant="destructive" onClick={stopTraining} className="w-full mt-2">
                  <Stop className="h-4 w-4 mr-2" /> Stop
                </Button>
              </>
            )}
            {status === 'paused' && (
              <>
                <Button onClick={resumeTraining} className="w-full">
                  <Play className="h-4 w-4 mr-2" /> Resume
                </Button>
                <Button variant="destructive" onClick={stopTraining} className="w-full mt-2">
                  <Stop className="h-4 w-4 mr-2" /> Stop
                </Button>
              </>
            )}
            {(status === 'completed' || status === 'stopped') && (
              <Button variant="outline" onClick={resetTraining} className="w-full">
                <RotateCw className="h-4 w-4 mr-2" /> Reset
              </Button>
            )}
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Network</PanelTitle>
            <PanelDescription>
              Trains the network configured in Network Builder.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-2">
            <div className="text-xs text-synapse-muted">
              {network ? `${network.layerCount()} layers, ${network.totalParameters()} parameters` : 'None'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/network-builder')}
              className="w-full"
            >
              Open Network Builder
            </Button>
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-8 space-y-4">
        <Panel className="flex flex-col h-[300px]">
          <PanelHeader>
            <PanelTitle>Loss</PanelTitle>
            <PanelDescription>Training and validation loss over epochs.</PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16181e" />
                <XAxis dataKey="epoch" type="number" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const [entry] = payload;
                      return (
                        <div className="p-2 bg-synapse-panel border border-synapse-border">
                          <div className="text-xs text-synapse-muted">Epoch {entry.payload.epoch}</div>
                          <div className="text-xs font-mono text-synapse-cyan">Loss: {entry.payload.loss.toFixed(4)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="loss"
                  stroke="#00f3ff"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#00f3ff' }}
                />
                {history.some((h) => h.validationLoss != null) && (
                  <Line
                    type="monotone"
                    dataKey="validationLoss"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col h-[300px]">
          <PanelHeader>
            <PanelTitle>Accuracy</PanelTitle>
            <PanelDescription>Classification accuracy over epochs.</PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.filter((h) => h.accuracy != null)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#16181e" />
                <XAxis dataKey="epoch" type="number" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const [entry] = payload;
                      return (
                        <div className="p-2 bg-synapse-panel border border-synapse-border">
                          <div className="text-xs text-synapse-muted">Epoch {entry.payload.epoch}</div>
                          <div className="text-xs font-mono text-synapse-cyan">
                            Accuracy: {(entry.payload.accuracy * 100).toFixed(1)}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#00f3ff"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#00f3ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Status</PanelTitle>
            <PanelDescription>Live training state.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-synapse-muted block">Status</span>
                <span className="font-mono text-synapse-cyan">{status}</span>
              </div>
              <div>
                <span className="text-synapse-muted block">Epoch</span>
                <span className="font-mono text-synapse-ink">{currentEpoch}</span>
              </div>
              <div>
                <span className="text-synapse-muted block">Loss</span>
                <span className="font-mono text-synapse-ink">
                  {loss == null ? '—' : loss.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-synapse-muted block">Val. Loss</span>
                <span className="font-mono text-synapse-ink">
                  {validationLoss == null ? '—' : validationLoss.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-synapse-muted block">Accuracy</span>
                <span className="font-mono text-synapse-ink">
                  {accuracy == null ? '—' : (accuracy * 100).toFixed(1) + '%'}
                </span>
              </div>
              <div>
                <span className="text-synapse-muted block">Duration</span>
                <span className="font-mono text-synapse-ink">
                  {(durationMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
            {latest && (
              <div className="border-t border-synapse-border pt-3">
                <div className="text-xs text-synapse-muted">Latest epoch</div>
                <div className="text-xs font-mono text-synapse-ink">
                  loss {latest.loss.toFixed(4)} {latest.validationLoss != null ? `| val ${latest.validationLoss.toFixed(4)}` : ''}
                </div>
              </div>
            )}
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
  type = 'number',
  step,
  min,
  max,
  checked,
  children,
}: {
  label: string;
  value: number | boolean | string;
  onChange: (v: number | boolean | string) => void;
  type?: string;
  step?: string;
  min?: number;
  max?: number;
  checked?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-synapse-muted">{label}</label>
      {type === 'select' && children ? (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
        >
          {children}
        </select>
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-synapse-border bg-synapse-panel text-cyan-500 focus:ring-cyan-500"
        />
      ) : (
        <input
          type={type}
          step={step}
          min={min != null ? String(min) : undefined}
          max={max != null ? String(max) : undefined}
          value={String(value)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
        />
      )}
    </div>
  );
}
