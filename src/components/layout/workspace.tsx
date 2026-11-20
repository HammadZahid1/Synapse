import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Router, Route, usePathname, NAV_ITEMS } from '@/app/router';
import { Panel } from '@/components/ui/panel';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NetworkBuilderPage } from '@/features/network-builder/NetworkBuilderPage';
import { WeightExplorerPage } from '@/features/weight-explorer/WeightExplorerPage';
import { ObservatoryPage } from '@/features/observatory/ObservatoryPage';
import { TrainingLabPage } from '@/features/training/TrainingLabPage';
import { DigitRecognitionPage } from '@/features/digit-recognition/DigitRecognitionPage';
import { DatasetsPage } from '@/features/datasets/DatasetsPage';
import { ObservatoryPage } from '@/features/observatory/ObservatoryPage';
import { TrainingLabPage } from '@/features/training/TrainingLabPage';
import { DigitRecognitionPage } from '@/features/digit-recognition/DigitRecognitionPage';

export function WorkspaceLayout() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileDrawer, setMobileDrawer] = React.useState(false);
  const pathname = usePathname();

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

function stubPage(title: string, description: string, id: string) {
  return React.forwardRef(function StubPage(
    _props: unknown,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return (
      <div ref={ref} id={id} className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 rounded-full bg-synapse-border" />
          <h1 className="text-lg font-semibold text-synapse-ink">{title}</h1>
        </div>
        <p className="text-sm text-synapse-muted">{description}</p>
        <hr className="border-synapse-border" />
      </div>
    );
  });
}

const ModelComparisonPage = stubPage(
  'Model Comparison',
  'Compare multiple network architectures and training runs.',
  'page-model-comparison',
);
const ExperimentsPage = stubPage(
  'Experiments',
  'Create, save, and manage training experiments.',
  'page-experiments',
);
const SettingsPage = stubPage(
  'Settings',
  'Configure appearance, animation, and training defaults.',
  'page-settings',
);

export default WorkspaceLayout;
