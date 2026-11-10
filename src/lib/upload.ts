import { put } from '@vercel/blob';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

export async function uploadPhoto(
  file: File,
  folder: 'reports' | 'evidence' = 'reports'
): Promise<UploadResult> {
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      url: '',
      success: false,
      error: 'Hanya file JPG/PNG yang diizinkan',
    };
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return {
      url: '',
      success: false,
      error: 'Ukuran file maksimal 5 MB',
    };
  }

  try {
    const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return { url: blob.url, success: true };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      success: false,
      error: 'Gagal mengupload foto',
    };
  }
}

export async function uploadMultiplePhotos(
  files: File[],
  folder: 'reports' | 'evidence' = 'reports'
): Promise<UploadResult[]> {
  if (files.length > 3) {
    return [{ url: '', success: false, error: 'Maksimal 3 foto yang diizinkan' }];
  }

  const results = await Promise.all(files.map((file) => uploadPhoto(file, folder)));
  return results;
}

