import { pgTable, uuid, text, timestamp, integer, jsonb, decimal } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appleRecommendations = pgTable('apple_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Resource identification
  appleResourceId: text('apple_resource_id').notNull(),
  resourceType: text('resource_type').notNull(), // 'album', 'playlist', 'station', 'song'
  
  // Resource details
  resourceName: text('resource_name').notNull(),
  artistName: text('artist_name'),
  albumName: text('album_name'),
  
  // Recommendation metadata
  recommendationScore: decimal('recommendation_score', { precision: 5, scale: 2 }),
  recommendationReason: text('recommendation_reason'),
  
  // Resource metadata
  durationMs: integer('duration_ms'),
  albumArtUrl: text('album_art_url'),
  previewUrl: text('preview_url'),
  isrc: text('isrc'),
  
  // Apple Music specific
  contentRating: text('content_rating'),
  genres: text('genres').array(),
  catalogId: text('catalog_id'),
  
  // Rich metadata
  resourceMetadata: jsonb('resource_metadata'),
  
  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  syncVersion: text('sync_version'),
});