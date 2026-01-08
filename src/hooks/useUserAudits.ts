import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { AccessibilityAudit } from '../types';

interface AuditMetrics {
  latestAudit: AccessibilityAudit | null;
  allAudits: AccessibilityAudit[];
  averageScores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  mobileAverages: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    count: number;
  };
  desktopAverages: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    count: number;
  };
  totalAudits: number;
}

interface UseUserAuditsOptions {
  userId?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Custom hook to fetch and calculate user audit metrics
 * @param options Configuration options for audit fetching
 * @returns Audit metrics data, loading state, and error information
 */
export function useUserAudits(options: UseUserAuditsOptions = {}) {
  const { userId, limit = 50, enabled = true } = options;
  const [metrics, setMetrics] = useState<AuditMetrics>({
    latestAudit: null,
    allAudits: [],
    averageScores: {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
    },
    mobileAverages: {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      count: 0,
    },
    desktopAverages: {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      count: 0,
    },
    totalAudits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    if (!loadingRef.current) {
      loadingRef.current = true;
      fetchUserAudits();
    }

    return () => {
      loadingRef.current = false;
    };
  }, [userId, enabled, limit]);

  const fetchUserAudits = async () => {
    try {
      setError(null);

      if (!userId) {
        setMetrics({
          latestAudit: null,
          allAudits: [],
          averageScores: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
          },
          mobileAverages: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            count: 0,
          },
          desktopAverages: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            count: 0,
          },
          totalAudits: 0,
        });
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('accessibility_audits')
        .select(
          'id, url_scanned, performance_score, accessibility_score, best_practices_score, seo_score, device_type, created_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const audits = (data || []) as AccessibilityAudit[];

      if (audits.length === 0) {
        setMetrics({
          latestAudit: null,
          allAudits: [],
          averageScores: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
          },
          mobileAverages: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            count: 0,
          },
          desktopAverages: {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            count: 0,
          },
          totalAudits: 0,
        });
        setLoading(false);
        return;
      }

      const latestAudit = audits[0];

      const mobileAudits = audits.filter(a => a.device_type === 'mobile');
      const desktopAudits = audits.filter(a => a.device_type === 'desktop');

      const calculateAverages = (auditList: AccessibilityAudit[]) => {
        const count = auditList.length;
        if (count === 0) {
          return {
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
          };
        }
        return {
          performance: Math.round(
            auditList.reduce((sum, a) => sum + (a.performance_score || 0), 0) / count
          ),
          accessibility: Math.round(
            auditList.reduce((sum, a) => sum + (a.accessibility_score || 0), 0) / count
          ),
          bestPractices: Math.round(
            auditList.reduce((sum, a) => sum + (a.best_practices_score || 0), 0) / count
          ),
          seo: Math.round(auditList.reduce((sum, a) => sum + (a.seo_score || 0), 0) / count),
        };
      };

      const allAverages = calculateAverages(audits);
      const mobileAvg = calculateAverages(mobileAudits);
      const desktopAvg = calculateAverages(desktopAudits);

      setMetrics({
        latestAudit,
        allAudits: audits,
        averageScores: allAverages,
        mobileAverages: {
          ...mobileAvg,
          count: mobileAudits.length,
        },
        desktopAverages: {
          ...desktopAvg,
          count: desktopAudits.length,
        },
        totalAudits: audits.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audits';
      setError(errorMessage);
      console.error('Error fetching user audits:', err);
      setMetrics({
        latestAudit: null,
        allAudits: [],
        averageScores: {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
        },
        mobileAverages: {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
          count: 0,
        },
        desktopAverages: {
          performance: 0,
          accessibility: 0,
          bestPractices: 0,
          seo: 0,
          count: 0,
        },
        totalAudits: 0,
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const refetch = async () => {
    loadingRef.current = false;
    setLoading(true);
    await fetchUserAudits();
  };

  return {
    metrics,
    loading,
    error,
    refetch,
  };
}
