import { supabase } from './supabaseClient';

/** Private bucket created by 20251231232100_create_documents_storage_bucket.sql. */
export const LETTER_BUCKET = 'demand-letters';

/** Signed URLs are short-lived; the viewer requests a fresh one on every open. */
const SIGNED_URL_TTL_SECONDS = 10 * 60;

/**
 * Storage RLS only lets a user touch objects under a folder named after their
 * auth uid, so the path is always `<uid>/<letterId>/<file name>`.
 */
export function buildLetterFilePath(userId: string, letterId: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'document';
  return `${userId}/${letterId}/${safeName}`;
}

/**
 * Keeps the original upload so the letter can be reopened later, then records
 * the path on the letter row. The analysis has already been saved by the time
 * this runs, so a failure here is reported but never undoes the analysis.
 */
export async function storeLetterFile(file: File, userId: string, letterId: string): Promise<string> {
  const path = buildLetterFilePath(userId, letterId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(LETTER_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from('demand_letters')
    .update({ file_storage_path: path })
    .eq('id', letterId);
  if (updateError) throw updateError;

  return path;
}

/** Short-lived URL for previewing a stored letter in the viewer. */
export async function getLetterFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(LETTER_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error('Unable to open the document');
  return data.signedUrl;
}

export type LetterFileKind = 'pdf' | 'image' | 'other';

/** Decides how the viewer renders a stored file, from its path extension. */
export function getLetterFileKind(path: string): LetterFileKind {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
  return 'other';
}
