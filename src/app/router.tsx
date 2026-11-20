import { useState, useCallback, ReactNode } from 'react';

import { RouterContext } from './routerHooks';
import { NAV_ITEMS } from './nav';

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
