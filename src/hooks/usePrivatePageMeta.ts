import { useEffect } from 'react';

const PRIVATE_META = [
  { name: 'robots', content: 'noindex, nofollow' },
  { name: 'referrer', content: 'no-referrer' },
] as const;

/** Keeps a private page out of search indexes and outbound Referer headers while mounted. */
export function usePrivatePageMeta(): void {
  useEffect(() => {
    const added = PRIVATE_META.map(({ name, content }) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
      return meta;
    });
    return () => added.forEach((meta) => meta.remove());
  }, []);
}
