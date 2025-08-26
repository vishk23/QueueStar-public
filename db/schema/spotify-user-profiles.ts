import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const spotifyUserProfiles = pgTable('spotify_user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Spotify profile data
  spotifyId: text('spotify_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  imageUrl: text('image_url'),
  country: text('country'),
  
  // Spotify subscription info
  product: text('product'), // 'free', 'premium'
  followerCount: text('follower_count'),
  
  // Timestamps
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
});