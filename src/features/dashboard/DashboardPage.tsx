import * as React from 'react';
import { useNavigate } from '@/app/routerHooks';
import { presetConfigs } from '@/lib/ml/network';
import { allDatasets } from '@/lib/datasets/generators';
import { useNetworkStore } from '@/stores/networkStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';

export function DashboardPage() {
  const navigate = useNavigate();
  const { config, loadPreset, reset, initializeNetwork } = useNetworkStore();
  const { status, history, _resetTraining } = useTrainingStore();
  const { addNotification } = useUIStore();
  const presets = presetConfigs();
  const datasets = allDatasets();

  const latestLoss = history.length ? history[history.length - 1].loss : null;
  const epochsCompleted = history.length;

  const handleStartClassification = () => {
    const dataset = { inputs: [[0,0],[0,1],[1,0],[1,1]], targets: [[0],[1],[1],[0]] };
    useTrainingStore.getState().startTraining(dataset, {
      epochs: 200,
      learningRate: 0.1,
      batchSize: 1,
      optimizer: 'sgd',
      loss: 'mse',
      validationSplit: 0,
      shuffle: true,
    });
    addNotification({
      type: 'info',
      title: 'Training started',
      message: 'XOR classification training is running on the Training Lab.',
    });
    navigate('/training-lab');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PanelTitle>Dashboard</PanelTitle>
          <p className="text-sm text-synapse-muted mt-1">
            Your neural network laboratory. Current architecture:
            {config.inputSize} → {config.hiddenLayers.map((l) => l.size).join(' → ')} → {config.outputSize}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reset()}>
            Reset Architecture
          </Button>
          <Button onClick={() => initializeNetwork()}>Initialize Network</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Status" value={status} />
        <MetricCard label="Epochs Trained" value={String(epochsCompleted)} />
        <MetricCard label="Latest Loss" value={latestLoss == null ? '—' : latestLoss.toFixed(4)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="flex flex-col h-full">
          <PanelHeader>
            <PanelTitle>Quick Start</PanelTitle>
            <PanelDescription>Jump into a module or experiment.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <QuickStart
              label="Create a neural network"
              description="Build a custom layer-by-layer architecture."
              onClick={() => navigate('/network-builder')}
            />
            <QuickStart
              label="Load a preset"
              description="Start from XOR, regression, spiral, or digit configs."
              onClick={() => {}}
            />
            <QuickStart
              label="Start a classification experiment"
              description="Train the current network on XOR data."
              onClick={handleStartClassification}
            />
            <QuickStart
              label="Open the Digit Recognition Lab"
              description="Draw digits and classify them locally."
              onClick={() => navigate('/digit-recognition')}
            />
            <QuickStart
              label="Explore a dataset"
              description="Generate and inspect 2D and regression datasets."
              onClick={() => navigate('/datasets')}
            />
          </PanelContent>
        </Panel>

        <Panel className="flex flex-col h-full">
          <PanelHeader>
            <PanelTitle>Network Presets</PanelTitle>
            <PanelDescription>One-click architecture configurations.</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {Object.entries(presets).map(([id, cfg]) => (
              <PresetCard key={id} id={id} cfg={cfg} onLoad={() => loadPreset(cfg)} />
            ))}
          </PanelContent>
        </Panel>
      </div>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Available Datasets</PanelTitle>
          <PanelDescription>Locally generated datasets for experiments.</PanelDescription>
        </PanelHeader>
        <PanelContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {datasets.map((ds) => (
              <DatasetCard key={ds.id} ds={ds} />
            ))}
          </div>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Recent Activity</PanelTitle>
          <PanelDescription>Experiment and training history.</PanelDescription>
        </PanelHeader>
        <PanelContent className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-synapse-muted text-sm">
              No training activity yet. Start an experiment from Quick Start.
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice().reverse().map((m) => (
                <div key={m.epoch} className="flex justify-between items-center text-xs border-b border-synapse-border pb-1 last:border-0">
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
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="flex flex-col p-4">
      <PanelContent className="pb-2">
        <div className="text-xs text-synapse-muted uppercase tracking-wider">{label}</div>
        <div className="mt-1 font-mono text-lg text-synapse-ink">{value}</div>
      </PanelContent>
    </Panel>
  );
}

function QuickStart({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="w-full justify-start gap-3"
    >
      <div>
        <div className="text-sm font-medium text-synapse-ink">{label}</div>
        <div className="text-xs text-synapse-muted">{description}</div>
      </div>
      <span className="ml-auto text-synapse-cyan">→</span>
    </Button>
  );
}

function PresetCard({
  id,
  cfg,
  onLoad,
}: {
  id: string;
  cfg: ReturnType<typeof presetConfigs>[string];
  onLoad: () => void;
}) {
  return (
    <Panel className="flex flex-col p-3">
      <PanelContent className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-synapse-ink">{id}</div>
            <div className="text-xs text-synapse-muted mt-0.5">
              {cfg.inputSize} → {cfg.hiddenLayers.map((l) => l.size).join(' → ')} → {cfg.outputSize}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLoad}>
            Load
          </Button>
        </div>
      </PanelContent>
    </Panel>
  );
}

function DatasetCard({ ds }: { ds: ReturnType<typeof allDatasets>[number] }) {
  return (
    <Panel className="flex flex-col p-3">
      <PanelContent className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-synapse-ink">{ds.name}</div>
            <div className="text-xs text-synapse-muted mt-0.5">
              {ds.type} · {ds.description}
            </div>
          </div>
          <span className="text-xs font-mono text-synapse-cyan">
            {ds.inputs ? 'generate' : ''}
          </span>
        </div>
      </PanelContent>
    </Panel>
  );
}
