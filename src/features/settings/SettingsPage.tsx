import * as React from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useExperimentStore } from '@/stores/experimentStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader, PanelDescription } from '@/components/ui/panel';
import { RotateCw, Trash2, Save } from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettingsStore();
  const { clearAll } = useExperimentStore();
  const { addNotification } = useUIStore();
  const [importJson, setImportJson] = React.useState('');

  const toggle = (path: string, value: boolean) => {
    updateSettings({ [path]: value } as any);
  };

  const handleReset = async () => {
    resetSettings();
    addNotification({ type: 'info', title: 'Preferences reset' });
  };

  const handleClearStorage = async () => {
    await clearAll();
    addNotification({ type: 'success', title: 'Storage cleared' });
  };

  const handleImport = () => {
    const ok = importSettings(importJson);
    addNotification({
      type: ok ? 'success' : 'error',
      title: ok ? 'Settings imported' : 'Import failed',
    });
  };

  return (
    <div className="space-y-6">
      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Appearance</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-synapse-muted">Accent color</span>
            <div className="flex gap-2">
              {['cyan', 'violet', 'indigo'].map((accent) => (
                <button
                  key={accent}
                  onClick={() => toggle('appearance.accent', accent as any)}
                  className={`w-8 h-8 rounded-full border-2 ${settings.appearance.accent === accent ? 'border-cyan-500' : 'border-transparent'} ${accent === 'cyan' ? 'bg-cyan-500' : accent === 'violet' ? 'bg-violet-500' : 'bg-indigo-500'}`}
                  aria-label={`Accent ${accent}`}
                />
              ))}
            </div>
          </div>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Animation</PanelTitle>
          <PanelDescription>Motion preferences for the interface and visualizations.</PanelDescription>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="animations"
              type="checkbox"
              checked={settings.animation.enabled}
              onChange={(e) => toggle('animation.enabled', e.target.checked)}
              className="rounded border-synapse-border bg-synapse-panel text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="animations" className="text-sm text-synapse-ink">
              Enabled
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="reduced-motion"
              type="checkbox"
              checked={settings.animation.reducedMotion}
              onChange={(e) => toggle('animation.reducedMotion', e.target.checked)}
              className="rounded border-synapse-border bg-synapse-panel text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="reduced-motion" className="text-sm text-synapse-ink">
              Reduce motion
            </label>
          </div>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Visualization</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="show-activations"
              type="checkbox"
              checked={settings.visualization.showActivations}
              onChange={(e) => toggle('visualization.showActivations', e.target.checked)}
              className="rounded border-synapse-border bg-synapse-panel text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="show-activations" className="text-sm text-synapse-ink">
              Show neuron activations
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="show-weights"
              type="checkbox"
              checked={settings.visualization.showWeights}
              onChange={(e) => toggle('visualization.showWeights', e.target.checked)}
              className="rounded border-synapse-border bg-synapse-panel text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="show-weights" className="text-sm text-synapse-ink">
              Show connection weights
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-synapse-muted">Signal speed</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={String(settings.visualization.signalSpeed)}
              onChange={(e) =>
                updateSettings({
                  visualization: { ...settings.visualization, signalSpeed: parseFloat(e.target.value) },
                })
              }
              className="accent-cyan-500"
            />
          </div>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Training defaults</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Default epochs</label>
              <input
                type="number"
                value={String(settings.training.defaultEpochs)}
                onChange={(e) =>
                  updateSettings({
                    training: { ...settings.training, defaultEpochs: parseInt(e.target.value) || 1 },
                  })
                }
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Default learning rate</label>
              <input
                type="number"
                step="0.01"
                value={String(settings.training.defaultLearningRate)}
                onChange={(e) =>
                  updateSettings({
                    training: { ...settings.training, defaultLearningRate: parseFloat(e.target.value) || 0.1 },
                  })
                }
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Default batch size</label>
              <input
                type="number"
                value={String(settings.training.defaultBatchSize)}
                onChange={(e) =>
                  updateSettings({
                    training: { ...settings.training, defaultBatchSize: parseInt(e.target.value) || 1 },
                  })
                }
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-synapse-muted">Default validation split</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="0.9"
                value={String(settings.training.defaultValidationSplit)}
                onChange={(e) =>
                  updateSettings({
                    training: { ...settings.training, defaultValidationSplit: parseFloat(e.target.value) || 0 },
                  })
                }
                className="rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs text-synapse-ink"
              />
            </div>
          </div>
        </PanelContent>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>Storage</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleClearStorage} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Clear all experiments
            </Button>
          </div>
          <div className="border border-synapse-border bg-synapse-elevated rounded p-3">
            <div className="text-xs text-synapse-muted mb-2">Export preferences</div>
            <Button
              size="sm"
              onClick={() => {
                const json = exportSettings();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'synapse-settings.json';
                a.click();
                URL.revokeObjectURL(url);
                addNotification({ type: 'success', title: 'Settings exported' });
              }}
            >
              <Save className="h-4 w-4 mr-2" /> Download JSON
            </Button>
            <div className="mt-3">
              <label className="text-xs text-synapse-muted block mb-1">Import preferences</label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={4}
                className="w-full rounded border border-synapse-border bg-synapse-elevated px-2 py-1.5 text-xs font-mono text-synapse-ink"
                placeholder="Paste JSON settings here…"
              />
              <Button size="sm" className="mt-2" onClick={handleImport}>
                Import
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <Button variant="outline" onClick={handleReset}>
              <RotateCw className="h-4 w-4 mr-2" /> Reset preferences to defaults
            </Button>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
