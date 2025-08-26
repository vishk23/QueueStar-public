import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const blendStatusEnum = pgEnum('blend_status', ['pending', 'processing', 'completed']);

export const blends = pgTable('blends', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  name: text('name').notNull(),
  shareCode: text('share_code').notNull().unique(),
  status: blendStatusEnum('status').default('pending').notNull(),
  blendSettings: jsonb('blend_settings').default('{}'),
  playlistSpotifyId: text('playlist_spotify_id'),
  playlistAppleId: text('playlist_apple_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});