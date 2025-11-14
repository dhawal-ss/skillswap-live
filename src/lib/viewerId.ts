const viewerKey = 'skillswap-viewer-id';

export const getViewerId = () => {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(viewerKey);
  if (existing) return existing;
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  window.localStorage.setItem(viewerKey, generated);
  return generated;
};
