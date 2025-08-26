import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appleUserProfiles = pgTable('apple_user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Apple Music profile data
  appleMusicUserId: text('apple_music_user_id'), // May not always be available
  storefrontId: text('storefront_id').notNull(), // User's storefront (country)
  
  // Subscription info
  subscriptionStatus: text('subscription_status'), // Active subscription status
  
  // Timestamps
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
});