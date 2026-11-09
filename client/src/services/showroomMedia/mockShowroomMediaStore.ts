import { demoMedia, demoSessionVersion } from '../demo/demoSession';
// src/services/showroomMedia/mockShowroomMediaStore.ts
import type { ShowroomMediaAsset } from '../../types';
import { apiBaseUrl, authHeaders } from '../apiClient';

const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_INPUT_BYTES = 50 * 1024 * 1024; // Accept up to 50MB raw 4K/8K camera photos and downscale them!
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `media_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Downscales massive 4K/12MP+ mobile camera photos to a crisp 1600px WebP blob
 * off the main thread so the app never hangs or exhausts IndexedDB/memory.
 */
async function compressImageFile(file: File): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  // Skip tiny images or SVGs/GIFs
  if (file.size <= 350 * 1024 || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { blob: file, fileName: file.name, mimeType: file.type || 'image/jpeg' };
  }

  let objectUrl: string | null = null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      objectUrl = URL.createObjectURL(file);
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image for compression.'));
      el.src = objectUrl;
    });

    let { naturalWidth: width, naturalHeight: height } = img;
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { blob: file, fileName: file.name, mimeType: file.type };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY)
    );

    if (!compressedBlob || compressedBlob.size >= file.size) {
      return { blob: file, fileName: file.name, mimeType: file.type };
    }

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      blob: compressedBlob,
      fileName: `${baseName}.webp`,
      mimeType: 'image/webp',
    };
  } catch {
    // Graceful fallback if browser blocks canvas decoding
    return { blob: file, fileName: file.name, mimeType: file.type || 'image/jpeg' };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Demo adapter with automatic 4K photo optimization. Replace with backend S3/GCS upload in Phase 2. */
export async function saveShowroomMedia(file: File, storeId: string, isDemo: boolean): Promise<ShowroomMediaAsset> {
  const session = demoSessionVersion;
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    throw new Error('Upload an image or video file.');
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('Videos must be 25 MB or smaller.');
  }
  if (isImage && file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new Error('Image file exceeds the 50 MB maximum limit.');
  }

  // Compress before both remote and local persistence. Camera photos commonly
  // exceed the API's 25 MB limit even when the resulting WebP is only a few MB.
  const compressed = isImage && file.type !== 'image/gif'
    ? await compressImageFile(file)
    : { blob: file, fileName: file.name, mimeType: file.type || 'application/octet-stream' };
  const targetBlob = compressed.blob;
  const targetFileName = compressed.fileName;
  const targetMime = compressed.mimeType;
  if (targetBlob.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error('This image is still larger than the 25 MB upload limit. Choose a smaller photo.');
  }

  if (!isDemo) {
    if (!storeId) throw new Error('Choose a store before uploading showroom media.');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'].includes(targetMime)) {
      throw new Error('Use a JPEG, PNG, WebP, GIF, MP4, WebM, or QuickTime file.');
    }
    const response = await fetch(`${apiBaseUrl}/showroom/media?${new URLSearchParams({ storeId })}`, {
      method: 'POST', headers: authHeaders({ 'Content-Type': targetMime, 'X-File-Name': encodeURIComponent(targetFileName) }), body: targetBlob,
    });
    const result = await response.json().catch(() => null) as { data?: ShowroomMediaAsset; error?: { message?: string } } | null;
    if (!response.ok || !result?.data) throw new Error(result?.error?.message || 'Could not upload showroom media.');
    return result.data;
  }

  const asset: ShowroomMediaAsset = {
    id: createId(),
    fileName: targetFileName,
    mimeType: targetMime,
    sizeBytes: targetBlob.size,
    kind: isVideo ? 'video' : 'image',
    uploadedAt: new Date().toISOString(),
  };

  if (session !== demoSessionVersion) throw new Error('The demo session ended before the media was saved.');
  demoMedia.set(asset.id, targetBlob);
  return asset;
}

export async function getShowroomMedia(assetId: string, isDemo: boolean): Promise<Blob | null> {
  if (!isDemo) {
    const response = await fetch(`${apiBaseUrl}/showroom/media/${encodeURIComponent(assetId)}/content`, { headers: authHeaders() });
    if (!response.ok) return null;
    return response.blob();
  }
  return demoMedia.get(assetId) ?? null;
}
