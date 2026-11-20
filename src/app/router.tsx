import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { NAV_ITEMS } from './nav';

interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
  isActive: (to: string) => boolean;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function Router({
  children,
  defaultPath = '/',
}: {
  children: ReactNode;
  defaultPath?: string;
}) {
  const [pathname, setPathname] = useState(defaultPath);

  const navigate = useCallback((to: string) => {
    setPathname(to);
  }, []);

  const isActive = useCallback(
    (to: string) => pathname === to,
    [pathname],
  );

  return (
    <RouterContext.Provider value={{ pathname, navigate, isActive }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a Router');
  }
  return ctx;
}

export function Route({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { pathname, isActive } = useRouter();
  if (!isActive(path)) {
    return null;
  }
  return <>{children}</>;
}

export function usePathname() {
  return useRouter().pathname;
}

export function useNavigate() {
  return useRouter().navigate;
}

export { NAV_ITEMS };
