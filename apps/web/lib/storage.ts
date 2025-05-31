// apps/web/lib/storage.ts
import { put } from '@vercel/blob';

export async function uploadImageToBlob(
  imageBuffer: Buffer, 
  filename: string
): Promise<string> {
  const blob = await put(filename, imageBuffer, {
    access: 'public',
  });
  return blob.url;
}