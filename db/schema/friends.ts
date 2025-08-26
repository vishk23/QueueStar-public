import { pgTable, uuid, timestamp, text, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const friends = pgTable('friends', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  friendId: uuid('friend_id').references(() => users.id).notNull(),
  requestedBy: uuid('requested_by').references(() => users.id).notNull(), // Who sent the request
  status: text('status').notNull().default('accepted'), // 'pending', 'accepted', 'blocked'
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
}, (table) => ({
  // Composite primary key to ensure unique friendship pairs
  userFriend: primaryKey({ columns: [table.userId, table.friendId] }),
}));