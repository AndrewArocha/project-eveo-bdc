import { model, Schema, type InferSchemaType } from 'mongoose';

const reportSnapshotSchema = new Schema({
  dealerAccountId: { type: Schema.Types.ObjectId, ref: 'DealerAccount', required: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  reportType: { type: String, enum: ['store_kpi'], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  storeTimeZone: { type: String, required: true },
  generatedAt: { type: Date, required: true, default: Date.now },
  generatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  definitionVersion: { type: Number, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

reportSnapshotSchema.index({ dealerAccountId: 1, storeId: 1, generatedAt: -1 });

export type IReportSnapshot = InferSchemaType<typeof reportSnapshotSchema>;
export const ReportSnapshot = model('ReportSnapshot', reportSnapshotSchema);
