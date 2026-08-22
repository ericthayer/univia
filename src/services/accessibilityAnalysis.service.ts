import { getSupabaseFunctionHeaders, getSupabaseFunctionUrl } from './supabaseFunctions';

const MAX_REPORT_LENGTH = 50_000;
const ANALYSIS_FUNCTION = 'generate-accessibility-analysis';

interface AccessibilityAnalysisRequest {
  content: string;
  accessToken: string | null;
  signal?: AbortSignal;
}

interface AccessibilityAnalysisResponse {
  analysis?: unknown;
}

export async function requestAccessibilityAnalysis({
  content,
  accessToken,
  signal,
}: AccessibilityAnalysisRequest): Promise<string> {
  if (!accessToken) {
    throw new Error('Authentication required');
  }

  if (!content.trim()) {
    throw new Error('Report content is required');
  }

  if (content.length > MAX_REPORT_LENGTH) {
    throw new Error('Report content is too long');
  }

  let response: Response;
  try {
    response = await fetch(
      getSupabaseFunctionUrl(ANALYSIS_FUNCTION),
      {
        method: 'POST',
        headers: getSupabaseFunctionHeaders(accessToken),
        body: JSON.stringify({ content }),
        signal,
      },
    );
  } catch {
    throw new Error('Analysis service unavailable');
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (response.status === 429) {
      throw new Error('Analysis limit reached. Please try again later.');
    }

    throw new Error('Analysis service unavailable');
  }

  let payload: AccessibilityAnalysisResponse;
  try {
    payload = await response.json() as AccessibilityAnalysisResponse;
  } catch {
    throw new Error('Invalid analysis response');
  }

  if (typeof payload.analysis !== 'string' || !payload.analysis.trim()) {
    throw new Error('Invalid analysis response');
  }

  return payload.analysis;
}
