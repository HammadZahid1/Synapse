import { type LucideProps } from 'lucide-react';
import {
  LayoutDashboard,
  Activity,
  Network,
  BarChart3,
  Globe,
  PieChart,
  Bot,
  Eye,
  CpuChip,
  Settings,
  LayoutGrid,
} from 'lucide-react';

type Icon = React.ComponentType<LucideProps>;


export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: Icon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    id: 'network-builder',
    label: 'Network Builder',
    path: '/network-builder',
    icon: Network,
  },
  {
    id: 'training-lab',
    label: 'Training Lab',
    path: '/training-lab',
    icon: Activity,
  },
  {
    id: 'observatory',
    label: 'Neural Observatory',
    path: '/observatory',
    icon: Eye,
  },
  {
    id: 'decision-boundary',
    label: 'Decision Boundary',
    path: '/decision-boundary',
    icon: Globe,
  },
  {
    id: 'weight-explorer',
    label: 'Weight Explorer',
    path: '/weight-explorer',
    icon: CpuChip,
  },
  {
    id: 'digit-recognition',
    label: 'Digit Recognition',
    path: '/digit-recognition',
    icon: Bot,
  },
  { id: 'datasets', label: 'Dataset Lab', path: '/datasets', icon: LayoutGrid },
  {
    id: 'model-comparison',
    label: 'Model Comparison',
    path: '/model-comparison',
    icon: BarChart3,
  },
  { id: 'experiments', label: 'Experiments', path: '/experiments', icon: PieChart },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

export function getIconForPath(path: string): Icon {
  const item = NAV_ITEMS.find((i) => i.path === path);
  return item ? item.icon : LayoutDashboard;
}
