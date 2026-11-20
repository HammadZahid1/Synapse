export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  notifications: Notification[];

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
}

let notificationId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  addNotification: (notification) => {
    const id = ++notificationId;
    const entry: Notification = { ...notification, id };
    set((state) => ({ notifications: [...state.notifications, entry] }));
    if (entry.duration !== 0) {
      const timeout = entry.duration ?? 4000;
      setTimeout(() => get().removeNotification(id), timeout);
    }
    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
