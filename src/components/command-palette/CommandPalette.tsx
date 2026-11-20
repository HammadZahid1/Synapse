import * as React from 'react';
import { X, Search, Keyboard, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle, PanelContent } from '@/components/ui/panel';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', description: 'Go to dashboard view', shortcut: 'g d', path: '/' },
  { id: 'network-builder', label: 'Network Builder', description: 'Build and configure neural networks', shortcut: 'g n', path: '/network-builder' },
  { id: 'training-lab', label: 'Training Lab', description: 'Train and monitor networks', shortcut: 'g t', path: '/training-lab' },
  { id: 'observatory', label: 'Neural Observatory', description: 'Visualize network activations', shortcut: 'g o', path: '/observatory' },
  { id: 'decision-boundary', label: 'Decision Boundary', description: 'Explore decision boundaries', shortcut: 'g b', path: '/decision-boundary' },
  { id: 'weight-explorer', label: 'Weight Explorer', description: 'Inspect network weights', shortcut: 'g w', path: '/weight-explorer' },
  { id: 'digit-recognition', label: 'Digit Recognition', description: 'Handwritten digit recognition', shortcut: 'g r', path: '/digit-recognition' },
  { id: 'datasets', label: 'Dataset Lab', description: 'Generate and validate datasets', shortcut: 'g s', path: '/datasets' },
  { id: 'experiments', label: 'Experiments', description: 'Manage saved experiments', shortcut: 'g e', path: '/experiments' },
  { id: 'model-comparison', label: 'Model Comparison', description: 'Compare multiple models', shortcut: 'g m', path: '/model-comparison' },
  { id: 'settings', label: 'Settings', description: 'Configure app preferences', shortcut: 'g s', path: '/settings' },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="relative w-full max-w-md p-1 bg-synapse-panel border border-synapse-border shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-synapse-border">
              <h2 className="text-sm font-semibold text-synapse-ink">Command Palette</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close command palette">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <PanelContent className="p-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-synapse-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-synapse-background border border-synapse-border rounded-md text-synapse-ink focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  autoFocus
                />
                <Keyboard className="absolute right-3 top-3 h-4 w-4 text-synapse-muted" />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-synapse-muted">No commands found</div>
                ) : (
                  filtered.map((cmd) => (
                    <Button
                      key={cmd.id}
                      variant="ghost"
                      size="sm"
                      className="flex items-center justify-between text-left text-sm"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <LayoutList className="h-4 w-4 text-synapse-muted" />
                        <div className="flex-1">
                          <div className="font-medium text-synapse-ink">{cmd.label}</div>
                          <div className="text-xs text-synapse-muted">{cmd.description}</div>
                        </div>
                        <span className="text-xs text-synapse-muted">{cmd.shortcut}</span>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </PanelContent>
            <div className="px-4 py-2 border-t border-synapse-border text-xs text-synapse-muted text-center">
              Press / to open • Esc to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
