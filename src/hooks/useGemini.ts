import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestAccessibilityAnalysis } from '../services/accessibilityAnalysis.service';
import { ensureSession } from '../services/session';

/**
 * Requests accessibility analysis through the authenticated server boundary.
 * The browser never receives a Gemini client or provider credential.
 */
export const useGemini = () => {
  const { session } = useAuth();
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const currentSession = await ensureSession();
      const analysis = await requestAccessibilityAnalysis({
        content: prompt,
        accessToken: currentSession?.access_token ?? null,
      });
      setResponse(analysis);
      return analysis;
    } catch (err: unknown) {
      const errorObject = err instanceof Error ? err : new Error('Analysis service unavailable');
      setError(errorObject);
      throw errorObject;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    response,
    isLoading,
    isStreaming: false,
    error,
    attribution: 'Powered by Google Gemini (server protected)',
    isReady: Boolean(session?.access_token),
  };
};
