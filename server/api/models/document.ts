import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  type: "reference" | "patient";
  patientId?: string;
  status: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
  fileUrl?: string;
  uploadType: "admin" | "doctor";
  userId: mongoose.Types.ObjectId;
}

const DocumentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, enum: ["reference", "patient"], required: true },
    patientId: { type: String },
    status: { type: String, required: true },
    tags: [String],
    metadata: { type: Schema.Types.Mixed },
    fileUrl: { type: String, required: true },
    uploadType: { type: String, enum: ["admin", "doctor"], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>(
  "Document",
  DocumentSchema
);
