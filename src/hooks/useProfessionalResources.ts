import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { ProfessionalResource } from '../types';

export type ResourceTypeFilter = ProfessionalResource['type'] | 'all';

export interface ProfessionalResourcesState {
  loading: boolean;
  /** Total listings before filtering; 0 means the directory itself is empty. */
  total: number;
  filtered: ProfessionalResource[];
  proBono: ProfessionalResource[];
  paid: ProfessionalResource[];
}

function matchesSearch(resource: ProfessionalResource, term: string): boolean {
  if (!term) return true;
  const needle = term.toLowerCase();
  return [resource.name, resource.description, resource.location, ...(resource.specializations ?? [])].some(
    (field) => field?.toLowerCase().includes(needle)
  );
}

/** Loads the vetted directory once and derives the filtered views. */
export function useProfessionalResources(searchTerm: string, typeFilter: ResourceTypeFilter): ProfessionalResourcesState {
  const [resources, setResources] = useState<ProfessionalResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('professional_resources')
        .select('*')
        .order('verified', { ascending: false })
        .order('rating', { ascending: false });
      if (cancelled) return;
      if (error) console.error('Error loading resources:', error);
      setResources(data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const term = searchTerm.trim();
    const filtered = resources.filter(
      (r) => (typeFilter === 'all' || r.type === typeFilter) && matchesSearch(r, term)
    );
    return {
      loading,
      total: resources.length,
      filtered,
      proBono: filtered.filter((r) => r.pro_bono),
      paid: filtered.filter((r) => !r.pro_bono),
    };
  }, [resources, loading, searchTerm, typeFilter]);
}
