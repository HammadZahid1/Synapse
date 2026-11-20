import { createContext, useContext } from 'react';

export interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
  isActive: (to: string) => boolean;
}

export const RouterContext = createContext<RouterContextValue | null>(null);

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a Router');
  }
  return ctx;
}

export function usePathname() {
  return useRouter().pathname;
}

export function useNavigate() {
  return useRouter().navigate;
}
