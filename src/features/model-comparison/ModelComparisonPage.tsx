import * as React from 'react';
import { useNavigate } from '@/app/router';
import { NeuralNetwork, presetConfigs } from '@/lib/ml/network';
import { TrainingEngine } from '@/lib/ml/training';
import { allDatasets } from '@/lib/datasets/generators';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader } from '@/components/ui/panel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Stop, Plus, Trash2 } from 'lucide-react';

type ModelConfig = {
  id: string;
  name: string;
  preset: keyof ReturnType<typeof presetConfigs>;
  datasetId: string;
};

export function ModelComparisonPage() {
  const _navigate = useNavigate();
  const [configs, setConfigs] = React.useState<ModelConfig[]>([
    { id: 'a', name: 'Model A', preset: 'xor', datasetId: 'xor' },
    { id: 'b', name: 'Model B', preset: 'two-layer', datasetId: 'xor' },
  ]);
  const [epochs, setEpochs] = React.useState(150);
  const [learningRate, setLearningRate] = React.useState(0.1);
  const [optimizer, setOptimizer] = React.useState<'sgd' | 'momentum' | 'adam'>('sgd');
  const [results, setResults] = React.useState<Map<string, any>>(new Map());
  const [statuses, setStatuses] = React.useState<Map<string, string>>(new Map());
  const [active, setActive] = React.useState<string | null>(null);

  const datasets = allDatasets();
  const presets = presetConfigs();

  const addConfig = () => {
    const id = `m-${Date.now()}`;
    setConfigs((c) => [...c, { id, name: `Model ${c.length + 1}`, preset: 'xor', datasetId: 'xor' }]);
  };

  const removeConfig = (id: string) => {
    setConfigs((c) => c.filter((x) => x.id !== id));
  };

  const trainAll = async () => {
    setActive(null);
    const engine = new TrainingEngine();
    const next = new Map<string, any>(results);
    const nextStatus = new Map<string, string>(statuses);
    for (const cfg of configs) {
      nextStatus.set(cfg.id, 'training');
      setStatuses(new Map(nextStatus));
      try {
        const net = new NeuralNetwork(presets[cfg.preset]);
        const dataset = generators[cfg.datasetId]();
        const result = await engine.train(net, dataset, {
          epochs,
          learningRate,
          batchSize: 4,
          optimizer,
          loss: 'binary-cross-entropy',
          validationSplit: 0,
          shuffle: true,
        });
        next.set(cfg.id, { ...result, config: cfg });
        nextStatus.set(cfg.id, result.status);
      } catch (_e) {
        nextStatus.set(cfg.id, 'idle');
      }
      setStatuses(new Map(nextStatus));
      setResults(new Map(next));
    }
    setActive(null);
  };

  const latest = (r: any) =>
    r.history.length ? r.history[r.history.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PanelTitle>Model Comparison</PanelTitle>
          <p className="text-sm text-synapse-muted">
            Train and compare multiple architectures on the same dataset.
          </p>
        </div>
        <Button onClick={addConfig}>
          <Plus className="h-4 w-4 mr-2" /> Add model
        </Button>
      </div>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Configurations</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-3">
          <div className="grid gap-3">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className="flex items-center gap-3 border border-synapse-border bg-synapse-panel p-3"
              >
                <input
                  value={cfg.name}
                  onChange={(e) => {
                    setConfigs((c) =>
                      c.map((x) => (x.id === cfg.id ? { ...x, name: e.target.value } : x)),
                    );
                  }}
                  className="flex-1 bg-transparent border-none text-sm text-synapse-ink focus:ring-0"
                />
                <select
                  value={cfg.preset}
                  onChange={(e) => {
                    setConfigs((c) =>
                      c.map((x) =>
                        x.id === cfg.id ? { ...x, preset: e.target.value as any } : x,
                      ),
                    );
                  }}
                  className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1 text-xs text-synapse-ink"
                >
                  {Object.keys(presets).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={cfg.datasetId}
                  onChange={(e) => {
                    setConfigs((c) =>
                      c.map((x) =>
                        x.id === cfg.id ? { ...x, datasetId: e.target.value } : x,
                      ),
                    );
                  }}
                  className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1 text-xs text-synapse-ink"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <Button variant="destructive" size="sm" onClick={() => removeConfig(cfg.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Epochs</label>
              <input
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value))}
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Learning rate</label>
              <input
                type="number"
                step="0.01"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Optimizer</label>
              <select
                value={optimizer}
                onChange={(e) => setOptimizer(e.target.value as any)}
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink w-full"
              >
                <option value="sgd">SGD</option>
                <option value="momentum">Momentum</option>
                <option value="adam">Adam</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            {active ? (
              <Button variant="destructive" onClick={() => {}} disabled>
                <Stop className="h-4 w-4 mr-2" /> Training…
              </Button>
            ) : (
              <Button onClick={trainAll} className="w-full">
                <Play className="h-4 w-4 mr-2" /> Train all models
              </Button>
            )}
          </div>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col h-[340px]">
        <PanelHeader>
          <PanelTitle>Loss Curves</PanelTitle>
        </PanelHeader>
        <PanelContent className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seriesData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16181e" />
              <XAxis dataKey="epoch" type="number" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              {configs.map((cfg) => {
                const r = results.get(cfg.id);
                if (!r) return null;
                return (
                  <Line
                    key={cfg.id}
                    type="monotone"
                    dataKey="loss"
                    stroke={cfg.id === 'a' ? '#00f3ff' : cfg.id === 'b' ? '#a855f7' : '#4f46e5'}
                    strokeWidth={2}
                    dot={false}
                    name={cfg.name}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Comparison Table</PanelTitle>
        </PanelHeader>
        <PanelContent className="flex-1 min-h-0 overflow-auto">
          <div className="overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-synapse-border">
                  <th className="text-left pb-2 text-xs text-synapse-muted">Model</th>
                  <th className="text-left pb-2 text-xs text-synapse-muted">Architecture</th>
                  <th className="text-left pb-2 text-xs text-synapse-muted">Dataset</th>
                  <th className="text-right pb-2 text-xs text-synapse-muted">Final loss</th>
                  <th className="text-right pb-2 text-xs text-synapse-muted">Accuracy</th>
                  <th className="text-right pb-2 text-xs text-synapse-muted">Epochs</th>
                  <th className="text-right pb-2 text-xs text-synapse-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((cfg) => {
                  const r = results.get(cfg.id);
                  const st = statuses.get(cfg.id) || 'idle';
                  const last = r ? latest(r) : null;
                  const arch = presets[cfg.preset];
                  return (
                    <tr key={cfg.id} className="border-b border-synapse-border">
                      <td className="py-2 text-xs font-medium text-synapse-ink">{cfg.name}</td>
                      <td className="py-2 text-xs text-synapse-muted">
                        {arch.hiddenLayers.map((l) => l.size).join(' → ')}
                      </td>
                      <td className="py-2 text-xs text-synapse-muted">{datasets.find((d) => d.id === cfg.datasetId)?.name}</td>
                      <td className="py-2 text-xs font-mono text-right">
                        {last ? last.loss.toFixed(4) : '—'}
                      </td>
                      <td className="py-2 text-xs font-mono text-right">
                        {last && last.accuracy != null ? (last.accuracy * 100).toFixed(1) + '%' : '—'}
                      </td>
                      <td className="py-2 text-xs font-mono text-right">
                        {r ? r.epochsCompleted : '—'}
                      </td>
                      <td className="py-2 text-xs text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${st === 'completed' ? 'bg-cyan-500/10 text-cyan-400' : st === 'training' ? 'bg-synapse-violet/10 text-violet-400' : 'bg-synapse-border text-synapse-muted'}`}>
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );

  function seriesData() {
    const maxEpochs = Math.max(epochs, ...Array.from(results.values()).map((r: any) => r.history.length));
    const data: Array<{ epoch: number } & Record<string, number>> = [];
    for (let e = 1; e <= maxEpochs; e++) {
      const row: any = { epoch: e };
      configs.forEach((cfg) => {
        const r = results.get(cfg.id);
        const h = r?.history.find((x: any) => x.epoch === e);
        row[cfg.name] = h ? h.loss : null;
      });
      data.push(row);
    }
    return data;
  }
}

const generators: Record<string, () => any> = {
  xor: () => { const { xorDataset } = require('@/lib/datasets/generators'); return xorDataset(); },
  linear: () => { const { linearRegressionDataset } = require('@/lib/datasets/generators'); return linearRegressionDataset(); },
  binary: () => { const { binaryClassificationDataset } = require('@/lib/datasets/generators'); return binaryClassificationDataset(); },
  clusters: () => { const { gaussianClustersDataset } = require('@/lib/datasets/generators'); return gaussianClustersDataset(); },
  circles: () => { const { circleDataset } = require('@/lib/datasets/generators'); return circleDataset(); },
  moons: () => { const { twoMoonsDataset } = require('@/lib/datasets/generators'); return twoMoonsDataset(); },
  spiral: () => { const { spiralDataset } = require('@/lib/datasets/generators'); return spiralDataset(); },
};
