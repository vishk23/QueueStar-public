import { pgTable, uuid, text, timestamp, integer, jsonb, decimal } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appleHeavyRotation = pgTable('apple_heavy_rotation', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Track/Album/Playlist identification
  appleResourceId: text('apple_resource_id').notNull(),
  resourceType: text('resource_type').notNull(), // 'song', 'album', 'playlist', 'station'
  
  // Resource details
  resourceName: text('resource_name').notNull(),
  artistName: text('artist_name'),
  albumName: text('album_name'),
  
  // Heavy rotation metrics
  playCount: integer('play_count'),
  rotationScore: decimal('rotation_score', { precision: 5, scale: 2 }), // Apple's rotation score
  lastPlayedAt: timestamp('last_played_at'),
  firstPlayedAt: timestamp('first_played_at'),
  
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