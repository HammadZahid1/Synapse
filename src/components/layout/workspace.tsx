import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Router, Route } from '@/app/router';
import { usePathname } from '@/app/routerHooks';
import { Panel } from '@/components/ui/panel';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NetworkBuilderPage } from '@/features/network-builder/NetworkBuilderPage';
import { WeightExplorerPage } from '@/features/weight-explorer/WeightExplorerPage';
import { ObservatoryPage } from '@/features/observatory/ObservatoryPage';
import { TrainingLabPage } from '@/features/training/TrainingLabPage';
import { DigitRecognitionPage } from '@/features/digit-recognition/DigitRecognitionPage';
import { DatasetsPage } from '@/features/datasets/DatasetsPage';
import { ExperimentsPage } from '@/features/experiments/ExperimentsPage';
import { ModelComparisonPage } from '@/features/model-comparison/ModelComparisonPage';
import { DecisionBoundaryPage } from '@/features/decision-boundary/DecisionBoundaryPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export function WorkspaceLayout() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileDrawer, setMobileDrawer] = React.useState(false);
  const _pathname = usePathname();

  return (
    <Router>
      <div className="flex h-screen bg-synapse-background text-synapse-ink overflow-hidden selection:bg-synapse-cyan selection:text-synapse-background">
        <button
          className="md:hidden p-2 text-synapse-muted"
          onClick={() => setMobileDrawer((d) => !d)}
          aria-label="Toggle navigation"
        />
        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((c) => !c)} />
        <div
          className={`
            fixed inset-y-0 left-0 z-50 flex flex-col w-64
            border-r border-synapse-border bg-synapse-secondary
            transition-transform duration-300 ease-in-out
            ${mobileDrawer ? 'translate-x-0' : '-translate-x-full'}
            md:hidden
          `}
          aria-hidden={mobileDrawer ? 'false' : 'true'}
        >
          <Sidebar isCollapsed={false} onToggle={() => setMobileDrawer(false)} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Topbar
            onOpenMenu={() => setIsCollapsed((c) => !c)}
            onOpenCommandPalette={() => {}}
            onSave={() => {}}
            onExport={() => {}}
            onSettings={() => {}}
          />
          <main className="flex-1 overflow-x-auto overflow-y-hidden bg-synapse-background">
            <Panel className="mx-6 my-4 h-[calc(100vh-4rem)] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <Route path="/">
                  <DashboardPage />
                </Route>
                <Route path="/network-builder">
                  <NetworkBuilderPage />
                </Route>
                <Route path="/training-lab">
                  <TrainingLabPage />
                </Route>
                <Route path="/observatory">
                  <ObservatoryPage />
                </Route>
                <Route path="/decision-boundary">
                  <DecisionBoundaryPage />
                </Route>
                <Route path="/weight-explorer">
                  <WeightExplorerPage />
                </Route>
                <Route path="/digit-recognition">
                  <DigitRecognitionPage />
                </Route>
                <Route path="/datasets">
                  <DatasetsPage />
                </Route>
                <Route path="/model-comparison">
                  <ModelComparisonPage />
                </Route>
                <Route path="/experiments">
                  <ExperimentsPage />
                </Route>
                <Route path="/settings">
                  <SettingsPage />
                </Route>
              </div>
            </Panel>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default WorkspaceLayout;
