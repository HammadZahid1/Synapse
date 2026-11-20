import * as React from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';
import { Play, Eye, Cpu } from 'lucide-react';
import { allDatasets } from '@/lib/datasets/generators';

interface Signal {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  strength: number;
}

const LAYER_SPACING = 170;
const NEURON_SPACING = 46;
const NEURON_RADIUS = 14;

export function ObservatoryPage() {
  const { network } = useNetworkStore();
  const [datasetId, setDatasetId] = React.useState<string>('xor');
  const [sampleIndex, setSampleIndex] = React.useState(0);
  const [activations, setActivations] = React.useState<number[][] | null>(null);
  const [signals, setSignals] = React.useState<Signal[]>([]);
  const [selected, setSelected] = React.useState<{
    layer: number;
    neuron: number;
  } | null>(null);
  const [_signalId, setSignalId] = React.useState(0);

  const datasets = allDatasets();
  const selectedDataset = datasets.find((d) => d.id === datasetId);
  const ds = selectedDataset ? selectedDataset.generate() : null;
  const sample = ds ? ds.inputs[sampleIndex % ds.inputs.length] : null;
  const target = ds ? ds.targets[sampleIndex % ds.targets.length] : null;

  const layerCount = network ? network.layerCount() : 0;
  const sizes = React.useMemo(() => {
    if (!network) return [];
    const out: number[] = [];
    for (let i = 0; i < layerCount; i++) out.push(network.getLayerConfig(i).outputSize);
    return out;
  }, [network, layerCount]);

  const handleProcess = () => {
    if (!network || !sample) return;
    const result = network.forward(sample);
    const acts = result.layerOutputs.map((layer) =>
      layer.map((row) => row[0]),
    );
    setActivations(acts);

    // Build signals for connections weighted by source activation * weight
    const next: Signal[] = [];
    let id = 0;
    const weights = network.getWeights();
    for (let l = 0; l < layerCount - 1; l++) {
      const fromSize = sizes[l];
      const toSize = sizes[l + 1];
      const w = weights[l].weights;
      const srcActs = acts[l];
      for (let i = 0; i < fromSize; i++) {
        const a = srcActs?.[i]?.[0] ?? 0;
        for (let j = 0; j < toSize; j++) {
          const strength = Math.abs(a * w[j][i]);
          if (strength < 0.02) continue;
          next.push({
            id: id++,
            fromX: 0,
            fromY: 0,
            toX: 0,
            toY: 0,
            strength,
          });
        }
      }
    }
    setSignals(next);
    setSignalId((s) => s + 1);
  };

  if (!network) {
    return (
      <Panel className="flex flex-col h-full">
        <PanelHeader>
          <PanelTitle>Neural Observatory</PanelTitle>
        </PanelHeader>
        <PanelContent className="flex flex-col items-center justify-center text-synapse-muted">
          Initialize a network in the Network Builder to observe it here.
        </PanelContent>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <Panel className="flex flex-col h-[560px]">
          <PanelHeader className="flex items-center justify-between">
            <PanelTitle>Signal Propagation</PanelTitle>
            <Button
              size="sm"
              onClick={handleProcess}
              disabled={!sample}
            >
              <Play className="h-4 w-4 mr-2" /> Process Sample
            </Button>
          </PanelHeader>
          <PanelContent className="flex-1 flex items-center justify-center min-h-0 relative overflow-hidden">
            <div className="w-full max-w-[640px] mx-auto">
              <ObservatoryCanvas
                sizes={sizes}
                activations={activations}
                signals={signals}
                selected={selected}
                onNeuronSelect={setSelected}
              />
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Sample</PanelTitle>
            <PanelDescription>
              Inspect the input being propagated.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <select
                value={datasetId}
                onChange={(e) => {
                  setDatasetId(e.target.value);
                  setSampleIndex(0);
                }}
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1 text-xs text-synapse-ink"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Button variant="ghost" size="icon" onClick={() => setSampleIndex((s) => s + 1)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-synapse-muted">
              Sample {sampleIndex % (ds?.inputs.length || 1) + 1} of{' '}
              {ds?.inputs.length || 0}
            </div>
            <div className="flex gap-1">
              {(sample || []).map((v, i) => (
                <div key={i} className="w-6 h-6 rounded border border-synapse-border flex items-center justify-center text-[10px] font-mono">
                  {v.toFixed(2)}
                </div>
              ))}
            </div>
            {target && (
              <div className="mt-2 text-xs text-synapse-muted">
                Target: {target.map((t) => t.toFixed(2)).join(', ')}
              </div>
            )}
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-7 space-y-4">
        {selected && (
          <NeuronInspectorPane
            selected={selected}
            network={network}
            activations={activations}
            sizes={sizes}
            onDeselect={() => setSelected(null)}
          />
        )}
        {!selected && (
          <Panel className="flex flex-col">
            <PanelHeader>
              <PanelTitle>Neuron Inspector</PanelTitle>
            </PanelHeader>
            <PanelContent className="flex flex-col items-center justify-center py-12">
              <Cpu className="h-12 w-12 text-synapse-muted mb-3" />
              <p className="text-xs text-synapse-muted">Select a neuron to inspect its activation, bias, and incoming weights.</p>
            </PanelContent>
          </Panel>
        )}
        <ConnectionStats signals={signals} />
      </div>
    </div>
  );
}

function ObservatoryCanvas({
  sizes,
  activations,
  signals,
  selected,
  onNeuronSelect,
}: {
  sizes: number[];
  activations: number[][] | null;
  signals: Signal[];
  selected: { layer: number; neuron: number } | null;
  onNeuronSelect: (layer: number, neuron: number) => void;
}) {
  const layerCount = sizes.length;
  const svgWidth = layerCount * LAYER_SPACING + 180;
  const svgHeight = 500;

  return (
    <svg
      className="w-full max-w-[640px]"
      width={svgWidth}
      height={svgHeight}
      role="img"
      aria-label="Neural observatory"
    >
      {sizes.map((toSize, layerIdx) => {
        if (layerIdx === 0) return null;
        const fromSize = sizes[layerIdx - 1];
        const x1 = 90 + (layerIdx - 1) * LAYER_SPACING;
        const x2 = 90 + layerIdx * LAYER_SPACING;
        return (
          <g key={layerIdx}>
            {Array.from({ length: fromSize }, (_, i) => {
              const y1 =
                svgHeight / 2 - ((fromSize - 1) * NEURON_SPACING) / 2 +
                i * NEURON_SPACING;
              return Array.from({ length: toSize }, (_, j) => {
                const y2 =
                  svgHeight / 2 - ((toSize - 1) * NEURON_SPACING) / 2 +
                  j * NEURON_SPACING;
                const sig = signals.find(
                  (s) => s.fromX === x1 + NEURON_RADIUS && s.fromY === y1 && s.toX === x2 - NEURON_RADIUS && s.toY === y2,
                );
                const active = sig ? sig.strength > 0 : false;
                return (
                  <line
                    key={`${i}-${j}`}
                    x1={x1 + NEURON_RADIUS}
                    y1={y1}
                    x2={x2 - NEURON_RADIUS}
                    y2={y2}
                    stroke={active ? '#00f3ff' : '#16181e'}
                    strokeOpacity={active ? Math.min(1, (sig?.strength ?? 0) * 3) : 0.15}
                    strokeWidth={active ? 2 + (sig?.strength ?? 0) * 2 : 1}
                    className="transition-all duration-500"
                  />
                );
              });
            })}
          </g>
        );
      })}

      {sizes.map((size, layerIdx) => {
        const x = 90 + layerIdx * LAYER_SPACING;
        const yStart =
          svgHeight / 2 - ((size - 1) * NEURON_SPACING) / 2;
        return (
          <g key={layerIdx}>
            {Array.from({ length: size }, (_, j) => {
              const y = yStart + j * NEURON_SPACING;
              const isSelected =
                selected?.layer === layerIdx && selected.neuron === j;
              const act = activations?.[layerIdx]?.[j]?.[0];
              const active = act != null;
              const intensity = active ? Math.min(1, Math.max(0, act)) : 0;
              return (
                <circle
                  key={j}
                  cx={x}
                  cy={y}
                  r={NEURON_RADIUS}
                  fill={active ? `rgba(0, 243, 255, ${0.2 + 0.8 * intensity})` : 'transparent'}
                  stroke={isSelected ? '#00f3ff' : active ? '#00f3ff' : '#1f2329'}
                  strokeWidth={isSelected ? 3 : active ? 2 : 1.5}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => onNeuronSelect(layerIdx, j)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNeuronSelect(layerIdx, j);
                    }
                  }}
                  role="button"
                  aria-label={
                    active
                      ? `Neuron ${j}, activation ${act.toFixed(3)}`
                      : `Neuron ${j}`
                  }
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function NeuronInspectorPane({
  selected,
  network,
  activations,
  sizes,
  onDeselect,
}: {
  selected: { layer: number; neuron: number };
  network: ReturnType<typeof useNetworkStore> extends { network: infer N } ? N : any;
  activations: number[][] | null;
  sizes: number[];
  onDeselect: () => void;
}) {
  const layer = selected.layer;
  const neuron = selected.neuron;
  const weightSets = network.getWeights();
  const incoming =
    layer === 0 ? [] : weightSets[layer - 1].weights.map((row) => row[neuron]);
  const bias = weightSets[layer].biases[neuron];
  const act = activations?.[layer]?.[neuron]?.[0] ?? null;

  return (
    <Panel className="flex flex-col">
      <PanelHeader className="flex items-center justify-between">
        <PanelTitle>Neuron Inspector</PanelTitle>
        <Button variant="ghost" size="icon" onClick={onDeselect} />
      </PanelHeader>
      <PanelContent className="space-y-3">
        <div className="text-xs font-mono text-synapse-ink">
          Layer {layer} · Neuron {neuron}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-synapse-muted block">Activation</span>
            <span className="font-mono text-synapse-cyan">
              {act == null ? '—' : act.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-synapse-muted block">Bias</span>
            <span className="font-mono text-synapse-ink">
              {bias?.toFixed(4) ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-synapse-muted block">Incoming</span>
            <span className="font-mono text-synapse-ink">
              {incoming.length}
            </span>
          </div>
          <div>
            <span className="text-synapse-muted block">Size</span>
            <span className="font-mono text-synapse-ink">
              {sizes[layer]}
            </span>
          </div>
        </div>
        <div className="border border-synapse-border rounded p-2">
          <div className="text-xs text-synapse-muted mb-1">Incoming weights</div>
          <div className="space-y-1 font-mono text-[10px]">
            {incoming.map((w, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-synapse-muted">w[{i}]</span>
                <span className={`text-synapse-ink ${w >= 0 ? 'text-cyan-400' : 'text-violet-400'}`}>
                  {w.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PanelContent>
    </Panel>
  );
}

function ConnectionStats({ signals }: { signals: Signal[] }) {
  const total = signals.length;
  const activeStrength = signals.reduce((s, sig) => s + sig.strength, 0);
  return (
    <Panel className="flex flex-col">
      <PanelHeader>
        <PanelTitle>Signal Activity</PanelTitle>
      </PanelHeader>
      <PanelContent>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-synapse-muted block">Active signals</span>
            <span className="font-mono text-synapse-cyan">{total}</span>
          </div>
          <div>
            <span className="text-synapse-muted block">Total strength</span>
            <span className="font-mono text-synapse-ink">
              {activeStrength.toFixed(3)}
            </span>
          </div>
        </div>
        <p className="text-xs text-synapse-muted mt-3">
          Signal strength = |source activation × weight|. Animations reflect
          actual forward-pass values.
        </p>
      </PanelContent>
    </Panel>
  );
}
