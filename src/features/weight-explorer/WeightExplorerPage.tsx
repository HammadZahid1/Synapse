import * as React from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';
import { mean, standardDeviation, median, min as mathMin, max as mathMax, flatten } from '@/lib/math/matrix';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function WeightExplorerPage() {
  const { network } = useNetworkStore();
  const [layerIndex, setLayerIndex] = React.useState(0);
  const [matrixKind, setMatrixKind] = React.useState<'weights' | 'biases'>('weights');

  if (!network) {
    return (
      <Panel className="flex flex-col h-full">
        <PanelHeader>
          <PanelTitle>Weight Explorer</PanelTitle>
        </PanelHeader>
        <PanelContent className="flex flex-col items-center justify-center text-synapse-muted py-12">
          Initialize a network in the Network Builder to explore weights here.
        </PanelContent>
      </Panel>
    );
  }

  const layerCount = network.layerCount();
  const weightSets = network.getWeights();
  const set = weightSets[layerIndex];
  const values = matrixKind === 'weights' ? flatten(set.weights) : set.biases;

  const stats = values.length
    ? {
        mean: mean(values),
        std: standardDeviation(values),
        median: median(values),
        min: mathMin(values),
        max: mathMax(values),
        pos: values.filter((v) => v > 0).length,
        neg: values.filter((v) => v < 0).length,
        zero: values.filter((v) => v === 0).length,
      }
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Layer</PanelTitle>
            <PanelDescription>
              Select a layer and matrix to inspect.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <div className="text-xs text-synapse-muted">
              {layerCount} layer(s) in network
            </div>
            <div className="space-y-2">
              {weightSets.map((_, i) => (
                <Button
                  key={i}
                  variant={layerIndex === i ? 'cyan' : 'outline'}
                  onClick={() => setLayerIndex(i)}
                  className="w-full justify-start text-xs gap-2"
                >
                  Layer {i} ({i === layerCount - 1 ? 'output' : 'hidden'}) ·
                  {set.weights.length}x{set.weights[0].length}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={matrixKind === 'weights' ? 'cyan' : 'outline'}
                size="sm"
                onClick={() => setMatrixKind('weights')}
              >
                Weights
              </Button>
              <Button
                variant={matrixKind === 'biases' ? 'cyan' : 'outline'}
                size="sm"
                onClick={() => setMatrixKind('biases')}
              >
                Biases
              </Button>
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Statistics</PanelTitle>
            <PanelDescription>Computed from the actual weight values.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {stats ? (
              <div className="space-y-2">
                <StatRow label="Mean" value={stats.mean.toFixed(4)} />
                <StatRow label="Std dev" value={stats.std.toFixed(4)} />
                <StatRow label="Median" value={stats.median.toFixed(4)} />
                <StatRow label="Min" value={stats.min.toFixed(4)} />
                <StatRow label="Max" value={stats.max.toFixed(4)} />
                <StatRow label="Positive" value={String(stats.pos)} />
                <StatRow label="Negative" value={String(stats.neg)} />
                <StatRow label="Zeros" value={String(stats.zero)} />
                <StatRow label="Count" value={String(values.length)} />
              </div>
            ) : (
              <p className="text-xs text-synapse-muted">No values.</p>
            )}
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-8 space-y-4">
        <Panel className="flex flex-col h-[520px]">
          <PanelHeader className="flex items-center justify-between">
            <PanelTitle>Weight Heatmap</PanelTitle>
            <PanelDescription>
              Layer {layerIndex} · {matrixKind}
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0 relative">
            <WeightHeatmap
              matrix={matrixKind === 'weights' ? set.weights : [set.biases.map((v) => [v])]}
            />
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col h-[300px]">
          <PanelHeader>
            <PanelTitle>Distribution</PanelTitle>
            <PanelDescription>Histogram of weight values.</PanelDescription>
          </PanelHeader>
          <PanelContent className="flex-1 min-h-0">
            <WeightHistogram values={values} />
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs border-b border-synapse-border pb-1 last:border-0">
      <span className="text-synapse-muted">{label}</span>
      <span className="font-mono text-synapse-ink">{value}</span>
    </div>
  );
}

function WeightHeatmap({ matrix }: { matrix: number[][] }) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const cell = 16;
  const flat: number[] = [];
  let absMax = 0;
  for (const row of matrix) for (const v of row) {
    flat.push(v);
    if (Math.abs(v) > absMax) absMax = Math.abs(v);
  }

  return (
    <div className="flex items-center justify-center">
      <svg width={cols * cell + 40} height={rows * cell + 40}>
        {matrix.map((row, r) =>
          row.map((v, c) => {
            const intensity = absMax > 0 ? Math.abs(v) / absMax : 0;
            const color = v >= 0 ? '#00f3ff' : '#a855f7';
            return (
              <rect
                key={`${r}-${c}`}
                x={20 + c * cell}
                y={20 + r * cell}
                width={cell - 1}
                height={cell - 1}
                fill={color}
                fillOpacity={Math.max(0.05, intensity)}
                className="transition-fill duration-300"
              >
                <title>{v.toFixed(4)}</title>
              </rect>
            );
          })
        )}
      </svg>
    </div>
  );
}

function WeightHistogram({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const absMax = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const bins = 20;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor(((v / absMax) + 1) / 2 * bins));
    counts[idx]++;
  }
  const _maxCount = Math.max(...counts);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={counts.map((c, i) => ({ bin: i, count: c }))}>
        <XAxis dataKey="bin" type="number" hide tick={{ fontSize: 10 }} />
        <YAxis hide tick={{ fontSize: 10 }} />
        <Tooltip
          content={({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const center = -absMax + (payload[0].payload.bin + 0.5) * (2 * absMax / bins);
              return (
                <div className="p-2 bg-synapse-panel border border-synapse-border">
                  <div className="text-xs text-synapse-muted">Bin ≈ {center.toFixed(3)}</div>
                  <div className="text-xs font-mono text-synapse-cyan">Count: {payload[0].payload.count}</div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="count" fill="#00f3ff" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
