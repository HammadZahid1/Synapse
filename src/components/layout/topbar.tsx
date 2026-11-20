import * as React from 'react';
import { useNavigate } from '@/app/routerHooks';
import { Button } from '@/components/ui/button';
import { Menu, Search, Save, Upload, Settings, Play } from 'lucide-react';

interface TopbarProps {
  onOpenMenu: () => void;
  onOpenCommandPalette: () => void;
  onSave: () => void;
  onExport: () => void;
  onSettings: () => void;
}

export function Topbar({
  onOpenMenu,
  onOpenCommandPalette,
  onSave,
  onExport,
  onSettings,
}: TopbarProps) {
  const _navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-synapse-border bg-synapse-secondary/80 backdrop-blur px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onOpenMenu} aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="text-sm font-semibold text-synapse-ink">SYNAPSE</span>
        </div>
        <div className="h-6 w-px bg-synapse-border" />
        <span className="text-xs font-medium text-synapse-muted uppercase tracking-wider">
          Workspace
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-xl px-2">
        <div className="relative flex-1">
          <div className="absolute left-2.5 top-2.5 h-4 w-4">
            <Search className="h-4 w-4 text-synapse-muted" />
          </div>
          <input
            type="search"
            className="flex h-9 w-full rounded-md border border-synapse-border bg-synapse-panel px-3 pr-10 text-sm text-synapse-ink placeholder:text-synapse-muted focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Command palette (Ctrl+K)..."
            onKeyDown={(e) => {
              if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onOpenCommandPalette();
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-2 border-r border-synapse-border">
          <span className="flex -space-x-1 rtl:space-x-reverse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border border-synapse-border bg-synapse-panel" />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-synapse-muted">
          <Play className="h-3 w-3 text-cyan-400" />
          <span>Idle</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onSave} aria-label="Save experiment">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onExport} aria-label="Export">
          <Upload className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings} aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
        <Button onClick={onOpenCommandPalette} size="sm">
          <Search className="h-4 w-4 mr-2" /> Command
        </Button>
      </div>
    </header>
  );
}
