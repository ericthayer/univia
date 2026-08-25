import { describe, expect, it } from 'vitest';
import { validateDocumentRequest } from './document-validation';

const validPdf = {
  fileContent: 'JVBERi0xLjc=',
  fileName: 'demand-letter.pdf',
  fileType: 'application/pdf',
};

describe('validateDocumentRequest', () => {
  it('accepts a supported file with matching magic bytes and defaults', () => {
    const result = validateDocumentRequest(validPdf);

    expect(result).toEqual({
      ok: true,
      value: {
        ...validPdf,
        modelPreference: 'flash',
        analysisDepth: 'standard',
      },
    });
  });

  it('rejects unknown request fields before processing', () => {
    const result = validateDocumentRequest({ ...validPdf, user_id: 'forged' });

    expect(result).toEqual({ ok: false, status: 422, error: 'Invalid request fields' });
  });

  it('rejects invalid base64 and MIME/magic-byte mismatches', () => {
    expect(validateDocumentRequest({ ...validPdf, fileContent: 'not base64' })).toEqual({
      ok: false,
      status: 422,
      error: 'File content is not valid base64',
    });
    expect(validateDocumentRequest({ ...validPdf, fileType: 'image/png' })).toEqual({
      ok: false,
      status: 422,
      error: 'File content does not match its declared type',
    });
  });

  it('rejects unsupported types, unsafe names, and invalid enum values', () => {
    expect(validateDocumentRequest({ ...validPdf, fileType: 'text/plain' })).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(validateDocumentRequest({ ...validPdf, fileName: '../letter.pdf' })).toEqual({
      ok: false,
      status: 422,
      error: 'Invalid file name',
    });
    expect(validateDocumentRequest({ ...validPdf, modelPreference: 'unknown' })).toMatchObject({
      ok: false,
      status: 422,
    });
  });

  it('rejects oversized encoded content before decoding it', () => {
    const result = validateDocumentRequest({
      ...validPdf,
      fileContent: `${validPdf.fileContent}${'A'.repeat(14_000_000)}`,
    });

    expect(result).toEqual({ ok: false, status: 413, error: 'File is too large' });
  });
});
