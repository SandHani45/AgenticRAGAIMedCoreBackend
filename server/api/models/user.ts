import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  sub?: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: Date;
  _id: string;
  // Add other fields as needed
}

const UserSchema: Schema = new Schema({
  sub: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  // Add other fields as needed
});

export const User = mongoose.model<IUser>("User", UserSchema);
