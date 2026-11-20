import * as React from 'react';
import { useNavigate } from '@/app/router';
import { useExperimentStore } from '@/stores/experimentStore';
import { useNetworkStore } from '@/stores/networkStore';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent, PanelHeader } from '@/components/ui/panel';
import { Play, Copy, Trash2, RefreshCw } from 'lucide-react';

export function ExperimentsPage() {
  const navigate = useNavigate();
  const {
    experiments,
    loading,
    error,
    fetchExperiments,
    createExperiment,
    getExperiment,
    duplicateExperiment,
    deleteExperiment,
    saveMetrics,
  } = useExperimentStore();
  const { loadPreset, config } = useNetworkStore();

  const [newName, setNewName] = React.useState('');

  React.useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  const handleReopen = (id: string) => {
    const experiment = getExperiment(id);
    if (!experiment) return;
    if (experiment.networkConfig) {
      loadPreset(experiment.networkConfig as any);
    }
    navigate('/network-builder');
  };

  const handleCreate = () => {
    const name = newName.trim() || 'Untitled experiment';
    createExperiment(name);
    setNewName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PanelTitle>Experiments</PanelTitle>
          <p className="text-sm text-synapse-muted">
            Saved experiments persisted in IndexedDB.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Experiment name"
            className="rounded border border-synapse-border bg-synapse-elevated px-3 py-1.5 text-xs text-synapse-ink w-48"
          />
          <Button onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-500/30 bg-red-500/10 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      <Panel className="flex flex-col h-full">
        <PanelHeader>
          <PanelTitle>Saved Experiments</PanelTitle>
        </PanelHeader>
        <PanelContent className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="text-xs text-synapse-muted text-center py-8">Loading…</div>
          ) : experiments.length === 0 ? (
            <div className="text-xs text-synapse-muted text-center py-8">
              No experiments yet. Create one to get started.
            </div>
          ) : (
            <div className="divide-y divide-synapse-border">
              {experiments.map((exp) => (
                <div key={exp.id} className="p-3 hover:bg-synapse-elevated cursor-pointer group border-b border-synapse-border last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-synapse-ink">{exp.name}</span>
                        <span className="px-1.5 py-0.5 rounded border border-synapse-border text-[10px] text-synapse-muted">
                          {exp.status}
                        </span>
                      </div>
                      <div className="text-xs text-synapse-muted mt-0.5">
                        {new Date(exp.updatedAt).toLocaleString()} ·
                        {new Date(exp.createdAt).toLocaleString()} created
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopen(exp.id);
                        }}
                        title="Reopen"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateExperiment(exp.id);
                        }}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExperiment(exp.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-synapse-muted block">Loss</span>
                      <span className="font-mono text-synapse-ink">
                        {exp.metrics && typeof exp.metrics === 'object' && 'loss' in exp.metrics
                          ? String((exp.metrics as any).loss)
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-synapse-muted block">Accuracy</span>
                      <span className="font-mono text-synapse-ink">
                        {exp.metrics && typeof exp.metrics === 'object' && 'accuracy' in exp.metrics
                          ? String(((exp.metrics as any).accuracy as number) * 100).slice(0, 5) + '%'
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelContent>
      </Panel>
    </div>
  );
}
