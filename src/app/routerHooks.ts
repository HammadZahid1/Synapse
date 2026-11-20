import { useContext } from 'react';

import { RouterContext } from './router';

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
