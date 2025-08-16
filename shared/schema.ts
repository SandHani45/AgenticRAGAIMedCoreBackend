import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "doctor", "patient"] }).notNull().default("patient"),
  specialization: varchar("specialization"), // For doctors
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table for reference documents and patient files
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  filename: varchar("filename").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  type: varchar("type", { enum: ["reference", "patient"] }).notNull(),
  status: varchar("status", { enum: ["uploading", "processing", "indexed", "error"] }).notNull().default("uploading"),
  uploadedById: varchar("uploaded_by_id").references(() => users.id),
  patientId: varchar("patient_id").references(() => users.id), // For patient documents
  metadata: jsonb("metadata"), // For storing AI analysis results
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Online sessions for tracking active users
export const onlineSessions = pgTable("online_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  location: varchar("location"),
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  onlineSessions: many(onlineSessions),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
  patient: one(users, {
    fields: [documents.patientId],
    references: [users.id],
  }),
}));

export const onlineSessionsRelations = relations(onlineSessions, ({ one }) => ({
  user: one(users, {
    fields: [onlineSessions.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertOnlineSession = typeof onlineSessions.$inferInsert;
export type OnlineSession = typeof onlineSessions.$inferSelect;

// Schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOnlineSessionSchema = createInsertSchema(onlineSessions).omit({
  id: true,
  createdAt: true,
});
