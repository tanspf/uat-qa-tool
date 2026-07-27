import { supabase, isSupabaseConfigured } from './supabaseClient';

const BUCKET_NAME = 'uat-evidence';

export async function uploadFileToStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // 1. Try uploading to Supabase Storage bucket if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      // Ensure bucket exists or attempt upload
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(cleanFileName, fileBuffer, {
          contentType: contentType || 'application/octet-stream',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(cleanFileName);
        
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else {
        console.warn('Supabase storage upload error, falling back to data URL:', error?.message);
      }
    } catch (err) {
      console.warn('Supabase storage exception:', err);
    }
  }

  // 2. Serverless in-memory fallback (Data URL / base64) - NO disk write (fs)
  const base64 = fileBuffer.toString('base64');
  const mime = contentType || 'application/octet-stream';
  return `data:${mime};base64,${base64}`;
}
