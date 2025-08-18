import mongoose from "mongoose";

const vectorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  values: { type: [Number], required: true },
  metadata: { type: Object },
});

const Vector = mongoose.models.Vector || mongoose.model("Vector", vectorSchema, "vectors");

export async function checkVectorExists(name: string): Promise<boolean> {
  const doc = await Vector.findOne({ name });
  return !!doc;
}

export async function insertVector(name: string, values: number[], metadata: object = {}): Promise<any> {
  const newVector = await Vector.create({ name, values, metadata });
  return newVector;
}

export { Vector };
