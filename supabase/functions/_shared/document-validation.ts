export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_NAME_LENGTH = 255;
const MAX_BASE64_LENGTH = Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4;

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const REQUEST_FIELDS = new Set([
  'fileContent',
  'fileName',
  'fileType',
  'business_id',
  'modelPreference',
  'analysisDepth',
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

type AllowedFileType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp';
type ModelPreference = 'flash' | 'pro';
type AnalysisDepth = 'standard' | 'detailed';

export interface DocumentRequest {
  fileContent: string;
  fileName: string;
  fileType: AllowedFileType;
  business_id?: string;
  modelPreference: ModelPreference;
  analysisDepth: AnalysisDepth;
}

export interface ValidationFailure {
  ok: false;
  status: 400 | 413 | 422;
  error: string;
}

export type DocumentValidationResult =
  | { ok: true; value: DocumentRequest }
  | ValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasUnsafeFileNameCharacters(fileName: string): boolean {
  return [...fileName].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f || character === '\\' || character === '/';
  });
}

function decodeBase64(value: string): Uint8Array | null {
  if (
    !value ||
    value.length > MAX_BASE64_LENGTH ||
    value.length % 4 !== 0 ||
    !BASE64_PATTERN.test(value)
  ) {
    return null;
  }

  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function hasExpectedMagicBytes(fileType: AllowedFileType, bytes: Uint8Array): boolean {
  if (fileType === 'application/pdf') {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  }

  if (fileType === 'image/png') {
    return bytes.length >= 8 && [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ].every((byte, index) => bytes[index] === byte);
  }

  if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}

export function validateDocumentRequest(body: unknown): DocumentValidationResult {
  if (!isRecord(body)) {
    return { ok: false, status: 400, error: 'Invalid request body' };
  }

  if (Object.keys(body).some((key) => !REQUEST_FIELDS.has(key))) {
    return { ok: false, status: 422, error: 'Invalid request fields' };
  }

  const { fileContent, fileName, fileType, business_id, modelPreference, analysisDepth } = body;

  if (
    typeof fileContent !== 'string' ||
    typeof fileName !== 'string' ||
    typeof fileType !== 'string'
  ) {
    return { ok: false, status: 400, error: 'File content, name, and type are required' };
  }

  if (!fileName.trim() || fileName.length > MAX_DOCUMENT_NAME_LENGTH || hasUnsafeFileNameCharacters(fileName)) {
    return { ok: false, status: 422, error: 'Invalid file name' };
  }

  if (fileContent.length > MAX_BASE64_LENGTH) {
    return { ok: false, status: 413, error: 'File is too large' };
  }

  if (!ALLOWED_FILE_TYPES.has(fileType)) {
    return { ok: false, status: 422, error: 'File type is not supported' };
  }

  if (business_id !== undefined && (typeof business_id !== 'string' || !UUID_PATTERN.test(business_id))) {
    return { ok: false, status: 422, error: 'Invalid business identifier' };
  }

  if (modelPreference !== undefined && modelPreference !== 'flash' && modelPreference !== 'pro') {
    return { ok: false, status: 422, error: 'Invalid model preference' };
  }

  if (analysisDepth !== undefined && analysisDepth !== 'standard' && analysisDepth !== 'detailed') {
    return { ok: false, status: 422, error: 'Invalid analysis depth' };
  }

  const bytes = decodeBase64(fileContent);
  if (!bytes) {
    return { ok: false, status: 422, error: 'File content is not valid base64' };
  }

  if (bytes.length > MAX_DOCUMENT_BYTES) {
    return { ok: false, status: 413, error: 'File is too large' };
  }

  if (!hasExpectedMagicBytes(fileType as AllowedFileType, bytes)) {
    return { ok: false, status: 422, error: 'File content does not match its declared type' };
  }

  return {
    ok: true,
    value: {
      fileContent,
      fileName,
      fileType: fileType as AllowedFileType,
      business_id,
      modelPreference: (modelPreference as ModelPreference | undefined) ?? 'flash',
      analysisDepth: (analysisDepth as AnalysisDepth | undefined) ?? 'standard',
    },
  };
}
