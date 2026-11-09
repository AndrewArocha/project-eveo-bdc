import type { RequestHandler } from 'express';
import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']);
function bucket() {
  const db = mongoose.connection.db;
  if (!db) throw new AppError(503, 'Media storage is not ready.', 'MEDIA_STORAGE_UNAVAILABLE');
  return new GridFSBucket(db, { bucketName: 'showroomMedia' });
}
function safeFileName(value: string) { return value.replace(/[\\/\r\n\0]/g, '_').slice(0, 180) || 'showroom-media'; }

export const uploadShowroomMedia: RequestHandler = asyncHandler(async (request, response) => {
  const storeId = String(request.query.storeId || '');
  const mimeType = request.header('content-type')?.split(';')[0]?.toLowerCase() || '';
  if (!allowedTypes.has(mimeType)) throw new AppError(415, 'Use a JPEG, PNG, WebP, GIF, MP4, WebM, or QuickTime file.', 'MEDIA_TYPE_UNSUPPORTED');
  if (!Buffer.isBuffer(request.body) || request.body.length === 0 || request.body.length > MAX_MEDIA_BYTES) throw new AppError(413, 'Media must be between 1 byte and 25 MB.', 'MEDIA_SIZE_INVALID');
  const fileName = safeFileName(decodeURIComponent(request.header('x-file-name') || 'showroom-media'));
  const id = new ObjectId();
  const upload = bucket().openUploadStreamWithId(id, fileName, { contentType: mimeType, metadata: { dealerAccountId: request.auth!.dealerAccountId, storeId, uploadedByUserId: request.auth!.userId, kind: mimeType.startsWith('video/') ? 'video' : 'image' } });
  await new Promise<void>((resolve, reject) => { upload.once('finish', resolve); upload.once('error', reject); upload.end(request.body as Buffer); });
  response.status(201).json({ data: { id: id.toHexString(), fileName, mimeType, sizeBytes: request.body.length, kind: mimeType.startsWith('video/') ? 'video' : 'image', uploadedAt: new Date().toISOString() } });
});

export const getShowroomMediaContent: RequestHandler = asyncHandler(async (request, response) => {
  const rawId = request.params.id;
  if (typeof rawId !== 'string' || !ObjectId.isValid(rawId)) throw new AppError(404, 'Media not found.', 'MEDIA_NOT_FOUND');
  const files = await bucket().find({ _id: new ObjectId(rawId), 'metadata.dealerAccountId': request.auth!.dealerAccountId }).toArray();
  const file = files[0];
  if (!file) throw new AppError(404, 'Media not found.', 'MEDIA_NOT_FOUND');
  const storeId = String(file.metadata?.storeId || '');
  if (!await Store.exists({ _id: storeId, dealerAccountId: request.auth!.dealerAccountId }) || (request.auth!.role !== 'owner' && !request.auth!.storeIds.includes(storeId))) throw new AppError(404, 'Media not found.', 'MEDIA_NOT_FOUND');
  response.setHeader('Content-Type', file.contentType || 'application/octet-stream');
  response.setHeader('Content-Length', String(file.length));
  response.setHeader('Content-Disposition', `inline; filename="${safeFileName(file.filename)}"`);
  response.setHeader('Cache-Control', 'private, no-store');
  bucket().openDownloadStream(file._id).pipe(response);
});
