import {
  users,
  documents,
  onlineSessions,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type OnlineSession,
  type InsertOnlineSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByType(type: "reference" | "patient"): Promise<Document[]>;
  getDocumentsByUploader(uploaderId: string): Promise<Document[]>;
  getDocumentsByPatient(patientId: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
  
  // Online session operations
  createOnlineSession(session: InsertOnlineSession): Promise<OnlineSession>;
  getActiveSessions(): Promise<(OnlineSession & { user: User })[]>;
  updateSessionLastSeen(sessionId: string): Promise<void>;
  deactivateSession(sessionId: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    onlineUsers: number;
    totalDocuments: number;
    processingDocuments: number;
    activeDoctors: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Document operations
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(document).returning();
    return newDoc;
  }

  async getDocumentsByType(type: "reference" | "patient"): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.type, type))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByUploader(uploaderId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.uploadedById, uploaderId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByPatient(patientId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.patientId, patientId))
      .orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Online session operations
  
  async createOnlineSession(session: InsertOnlineSession): Promise<OnlineSession> {
    const [newSession] = await db.insert(onlineSessions).values(session).returning();
    return newSession;
  }

  async getActiveSessions(): Promise<(OnlineSession & { user: User })[]> {
    return await db
      .select()
      .from(onlineSessions)
      .leftJoin(users, eq(onlineSessions.userId, users.id))
      .where(eq(onlineSessions.isActive, true))
      .orderBy(desc(onlineSessions.lastSeen))
      .then(rows => rows.map(row => ({
        ...row.online_sessions,
        user: row.users!
      })));
  }

  async updateSessionLastSeen(sessionId: string): Promise<void> {
    await db
      .update(onlineSessions)
      .set({ lastSeen: new Date() })
      .where(eq(onlineSessions.sessionId, sessionId));
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await db
      .update(onlineSessions)
      .set({ isActive: false })
      .where(eq(onlineSessions.sessionId, sessionId));
  }

  // Dashboard stats
  
  async getDashboardStats(): Promise<{
    onlineUsers: number;
    totalDocuments: number;
    processingDocuments: number;
    activeDoctors: number;
  }> {
    const [onlineUsersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(onlineSessions)
      .where(eq(onlineSessions.isActive, true));

    const [totalDocsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);

    const [processingDocsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.status, "processing"));

    const [activeDoctorsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, "doctor"), eq(users.isActive, true)));

    return {
      onlineUsers: onlineUsersCount.count,
      totalDocuments: totalDocsCount.count,
      processingDocuments: processingDocsCount.count,
      activeDoctors: activeDoctorsCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
