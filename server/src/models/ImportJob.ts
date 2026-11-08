import { model, Schema, type InferSchemaType } from 'mongoose';

const importJobSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  kind: { type: String, enum: ['inventory_csv'], required: true },
  sourceName: { type: String, required: true, trim: true, maxlength: 180 },
  contentHash: { type: String, required: true },
  status: { type: String, enum: ['processing', 'completed', 'completed_with_errors', 'failed'], default: 'processing', required: true },
  totalRows: { type: Number, default: 0, required: true },
  createdCount: { type: Number, default: 0, required: true },
  observedCount: { type: Number, default: 0, required: true },
  errorCount: { type: Number, default: 0, required: true },
  rowErrors: { type: [{ row: Number, message: String }], default: [] },
  startedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now, required: true },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

importJobSchema.index({ dealerAccountId: 1, storeId: 1, kind: 1, contentHash: 1 }, { unique: true });
importJobSchema.index({ dealerAccountId: 1, storeId: 1, createdAt: -1 });

export type IImportJob = InferSchemaType<typeof importJobSchema>;
export const ImportJob = model('ImportJob', importJobSchema);
