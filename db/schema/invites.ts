import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // Shareable invite code
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  usedBy: uuid('used_by').references(() => users.id), // Who used this invite
  maxUses: integer('max_uses').default(1), // How many times it can be used
  usedCount: integer('used_count').default(0),
  expiresAt: timestamp('expires_at'), // Optional expiration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usedAt: timestamp('used_at'),
});