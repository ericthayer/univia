export interface LighthouseAudit {
  score?: number | null;
  title: string;
  description: string;
  displayValue?: string;
  details?: {
    data?: unknown;
    items?: unknown;
  };
}

export interface LighthouseResult {
  categories: Record<string, { score?: number | null }>;
  audits: Record<string, LighthouseAudit>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteScore(value: unknown): value is number | null | undefined {
  return value === null || value === undefined || (
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
  );
}

export function parseLighthouseResult(value: unknown): LighthouseResult | null {
  if (!isRecord(value) || !isRecord(value.categories) || !isRecord(value.audits)) {
    return null;
  }

  const categories: LighthouseResult['categories'] = {};
  for (const [name, category] of Object.entries(value.categories)) {
    if (!isRecord(category) || !isFiniteScore(category.score)) return null;
    categories[name] = { score: category.score };
  }

  const audits: LighthouseResult['audits'] = {};
  for (const [name, audit] of Object.entries(value.audits)) {
    if (!isRecord(audit) || !isFiniteScore(audit.score)) return null;

    const detailsValue = audit.details;
    if (detailsValue !== undefined && detailsValue !== null && !isRecord(detailsValue)) return null;
    const details = isRecord(detailsValue) ? detailsValue : undefined;

    audits[name] = {
      score: audit.score,
      title: typeof audit.title === 'string' ? audit.title.slice(0, 1_000) : name,
      description: typeof audit.description === 'string' ? audit.description.slice(0, 2_000) : '',
      displayValue: typeof audit.displayValue === 'string' ? audit.displayValue.slice(0, 1_000) : undefined,
      details: details ? {
        data: details.data,
        items: details.items,
      } : undefined,
    };
  }

  return { categories, audits };
}
