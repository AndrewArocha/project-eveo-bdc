import type { ShowroomMediaAsset } from '../../types';

const DATABASE_NAME = 'eveo-showroom-media-demo';
const STORE_NAME = 'assets';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `media_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local media storage.'));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open media storage.'));
  });
}

/** Demo adapter only. Replace with your authenticated backend/object-storage upload. */
export async function saveMockShowroomMedia(file: File): Promise<ShowroomMediaAsset> {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new Error('Upload an image or video file.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('For the local demo, media must be 25 MB or smaller.');
  }

  const asset: ShowroomMediaAsset = {
    id: createId(),
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    kind: file.type.startsWith('video/') ? 'video' : 'image',
    uploadedAt: new Date().toISOString(),
  };

  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(file, asset.id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save media.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Media save was cancelled.'));
    });
  } finally {
    database.close();
  }

  return asset;
}

export async function getMockShowroomMedia(assetId: string): Promise<Blob | null> {
  const database = await openDatabase();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(assetId);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error('Could not retrieve media.'));
    });
  } finally {
    database.close();
  }
}
