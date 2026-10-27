import { useEffect, useState } from 'react';

/** Roteamento mínimo por hash (#/nova, #/acompanhar/SGDC-2026-0001). Funciona em hospedagem estática. */
export function parseHash(hash) {
  const [path = '/', query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] ?? '', param: parts[1] ? decodeURIComponent(parts[1]) : '', query: new URLSearchParams(query) };
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const navigate = (to) => {
  window.location.hash = to;
};
