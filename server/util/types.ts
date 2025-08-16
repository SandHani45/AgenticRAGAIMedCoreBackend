import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    name?: string;
    email?: string;
    role?: string;
    lastLogin?: Date;
    // Add other user fields as needed
  };
}