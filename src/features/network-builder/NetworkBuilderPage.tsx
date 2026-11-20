import * as React from 'react';
import { useNavigate } from '@/app/router';
import { useNetworkStore } from '@/stores/networkStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';
import { NetworkCanvas } from './NetworkCanvas';
import { Add, Minus, Play, RotateCw, Settings as SettingsIcon } from 'lucide-react';

export function NetworkBuilderPage() {
  const _navigate = useNavigate();
  const {
    config,
    network,
    _initializeNetwork,
    setHiddenLayers,
    setInputSize,
    setOutputSize,
    setOutputActivation,
    setWeightInit,
    randomize,
    loadPreset,
    reset,
  } = useNetworkStore();
  const presets = Object.entries(__getPresets());

  const [inputVector, _setInputVector] = React.useState<string>('');
  const [activations, setActivations] = React.useState<number[][] | null>(null);
  const [selected, setSelected] = React.useState<{
    layer: number;
    neuron: number;
  } | null>(null);

  const layerConfigs = config.hiddenLayers.map((l, i) => ({
    key: i,
    size: l.size,
    activation: l.activation,
  }));

  const handleForward = () => {
    if (!network) return;
    const values = inputVector
      ? inputVector.split(',').map((v) => parseFloat(v.trim()))
      : Array.from({ length: config.inputSize }, () => Math.random() * 2 - 1);
    if (values.some((v) => !Number.isFinite(v))) return;
    const result = network.forward(values);
    setActivations(result.layerOutputs.map((layer) =>
      layer.map((row) => row[0]),
    ));
  };

  const neuronInfo =
    selected && network
      ? {
          layer: selected.layer,
          neuron: selected.neuron,
          activation:
            activations?.[selected.layer]?.[selected.neuron]?.[0] ?? null,
          bias: network.getWeights()[selected.layer].biases[selected.neuron],
          activationName:
            selected.layer === network.layerCount() - 1
              ? config.outputActivation
              : config.hiddenLayers[selected.layer]?.activation,
        }
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Architecture</PanelTitle>
            <PanelDescription>
              Configure layers, neurons, and activations.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-synapse-muted">
                Input dimension
              </label>
              <input
                type="number"
                value={config.inputSize}
                onChange={(e) => setInputSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-synapse-muted">
                Output dimension
              </label>
              <input
                type="number"
                value={config.outputSize}
                onChange={(e) => setOutputSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-synapse-muted">
                Output activation
              </label>
              <select
                value={config.outputActivation}
                onChange={(e) => setOutputActivation(e.target.value as any)}
                className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              >
                {['sigmoid', 'relu', 'tanh', 'softmax', 'linear'].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-synapse-muted">
                Weight initialization
              </label>
              <select
                value={config.weightInit}
                onChange={(e) => setWeightInit(e.target.value as any)}
                className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              >
                {['xavier', 'he', 'random', 'zeros'].map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={randomize} size="sm">
                <RotateCw className="h-4 w-4 mr-2" /> Randomize
              </Button>
              <Button variant="outline" onClick={reset} size="sm">
                Reset
              </Button>
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Hidden Layers</PanelTitle>
            <PanelDescription>
              {config.hiddenLayers.length} hidden layer(s)
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-2">
            {layerConfigs.map((lc, i) => (
              <div key={i} className="flex items-center gap-2 border border-synapse-border bg-synapse-elevated p-2">
                <span className="text-xs text-synapse-muted w-16">
                  Hidden {i + 1}
                </span>
                <input
                  type="number"
                  value={lc.size}
                  onChange={(e) => {
                    const next = layerConfigs.map((l, idx) =>
                      idx === i ? { ...l, size: Math.max(1, parseInt(e.target.value) || 1) } : l,
                    );
                    setHiddenLayers(next);
                  }}
                  className="w-20 rounded border border-synapse-border bg-synapse-panel px-2 py-1 text-xs text-synapse-ink"
                />
                <select
                  value={lc.activation}
                  onChange={(e) => {
                    const next = layerConfigs.map((l, idx) =>
                      idx === i ? { ...l, activation: e.target.value as any } : l,
                    );
                    setHiddenLayers(next);
                  }}
                  className="rounded border border-synapse-border bg-synapse-panel px-2 py-1 text-xs text-synapse-ink"
                >
                  {['sigmoid', 'relu', 'tanh'].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => {
                  const next = layerConfigs.filter((_, idx) => idx !== i);
                  setHiddenLayers(next);
                }}>
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="pt-2">
              <Button size="sm" onClick={() => {
                const next = [...layerConfigs, { size: 4, activation: 'tanh' }];
                setHiddenLayers(next);
              }}>
                <Add className="h-4 w-4 mr-2" /> Add hidden layer
              </Button>
            </div>
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>Presets</PanelTitle>
            <PanelDescription>
              Load a predefined architecture.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-2">
            {presets.map(([id, cfg]) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => loadPreset(cfg)}
                className="w-full justify-start text-xs"
              >
                {id}
              </Button>
            ))}
          </PanelContent>
        </Panel>
      </div>

      <div className="lg:col-span-8 space-y-4">
        <Panel className="flex flex-col h-[520px]">
          <PanelHeader className="flex items-center justify-between">
            <PanelTitle>Network Visualization</PanelTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleForward}>
                <Play className="h-4 w-4" /> Forward
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/observatory')}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>
          </PanelHeader>
          <PanelContent className="flex-1 flex items-center justify-center min-h-0">
            <NetworkCanvas
              activations={activations}
              onNeuronSelect={setSelected}
              selected={selected}
            />
          </PanelContent>
        </Panel>

        {selected && network && (
          <NeuronInspector selected={selected} info={neuronInfo} />
        )}
      </div>
    </div>
  );
}

function __getPresets() {
  return {
    'single-layer': { inputSize: 2, outputSize: 1, hiddenLayers: [], outputActivation: 'sigmoid', weightInit: 'xavier' as const },
    xor: { inputSize: 2, outputSize: 1, hiddenLayers: [{ size: 4, activation: 'tanh' }], outputActivation: 'sigmoid', weightInit: 'xavier' as const },
    'two-layer': { inputSize: 2, outputSize: 1, hiddenLayers: [{ size: 8, activation: 'tanh' }, { size: 4, activation: 'tanh' }], outputActivation: 'sigmoid', weightInit: 'xavier' as const },
    regression: { inputSize: 1, outputSize: 1, hiddenLayers: [{ size: 8, activation: 'tanh' }], outputActivation: 'linear', weightInit: 'xavier' as const },
  };
}

function NeuronInspector({
  _selected,
  info,
}: {
  selected: { layer: number; neuron: number };
  info: {
    layer: number;
    neuron: number;
    activation: number | null;
    bias: number;
    activationName: string;
  } | null;
}) {
  return (
    <Panel className="flex flex-col">
      <PanelHeader>
        <PanelTitle>Neuron Inspector</PanelTitle>
      </PanelHeader>
      <PanelContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-synapse-muted block">Layer</span>
            <span className="font-mono text-synapse-ink">{info?.layer}</span>
          </div>
          <div>
            <span className="text-synapse-muted block">Index</span>
            <span className="font-mono text-synapse-ink">{info?.neuron}</span>
          </div>
          <div>
            <span className="text-synapse-muted block">Activation</span>
            <span className="font-mono text-synapse-ink">
              {info?.activation == null ? '—' : info.activation.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-synapse-muted block">Bias</span>
            <span className="font-mono text-synapse-ink">
              {info?.bias == null ? '—' : info.bias.toFixed(4)}
            </span>
          </div>
        </div>
        {info && (
          <div>
            <span className="text-xs text-synapse-muted block mb-1">
              Activation function
            </span>
            <span className="text-xs font-mono text-synapse-cyan">{info.activationName}</span>
          </div>
        )}
        <p className="text-xs text-synapse-muted">
          Select a neuron on the graph to inspect its weights and activation.
        </p>
      </PanelContent>
    </Panel>
  );
}
