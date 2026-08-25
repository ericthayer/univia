import { describe, expect, it } from 'vitest';
import { parseLighthouseResult } from './lighthouse-result';

describe('parseLighthouseResult', () => {
  it('accepts checklist objects in audit details items', () => {
    const result = parseLighthouseResult({
      categories: { accessibility: { score: 1 } },
      audits: {
        'document-latency-insight': {
          title: 'Document request latency',
          description: 'A valid Lighthouse insight.',
          score: 1,
          details: {
            type: 'checklist',
            items: {
              serverResponseIsFast: { value: true, label: 'Server responds quickly' },
            },
          },
        },
      },
    });

    expect(result).not.toBeNull();
    expect(result?.audits['document-latency-insight'].details?.items).toEqual({
      serverResponseIsFast: { value: true, label: 'Server responds quickly' },
    });
  });
});
