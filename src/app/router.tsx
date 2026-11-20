import { createContext, useState, useCallback, ReactNode } from 'react';

import { NAV_ITEMS } from './nav';

interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
  isActive: (to: string) => boolean;
}

export const RouterContext = createContext<RouterContextValue | null>(null);

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

export function Route({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { isActive } = useRouter();
  if (!isActive(path)) {
    return null;
  }
  return <>{children}</>;
}

export { NAV_ITEMS };
