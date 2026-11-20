import * as React from 'react';
import { useNavigate } from '@/app/routerHooks';
import { NAV_ITEMS } from '@/app/nav';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();

  const handleItemKeyDown = (
    event: React.KeyboardEvent,
    path: string,
  ): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        border-r border-synapse-border
        bg-synapse-secondary
      `}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-3 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        {!isCollapsed && (
          <span className="ml-2 text-xs font-semibold tracking-wider text-synapse-ink">
            SYNAPSE
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto" role="navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={isCollapsed ? 'ghost' : 'outline'}
              size={isCollapsed ? 'icon' : 'sm'}
              onClick={() => navigate(item.path)}
              onKeyDown={(e) => handleItemKeyDown(e, item.path)}
              className={`w-full justify-start ${isCollapsed ? 'px-0' : 'px-3 gap-3'}`}
              role="menuitem"
              tabIndex={0}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!isCollapsed && item.label}
            </Button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-synapse-border">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
    </aside>
  );
}
