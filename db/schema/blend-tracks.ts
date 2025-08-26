import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { blends } from './blends';
import { users } from './users';

export const blendTracks = pgTable('blend_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  blendId: uuid('blend_id').references(() => blends.id).notNull(),
  contributedBy: uuid('contributed_by').references(() => users.id).notNull(),
  trackId: text('track_id').notNull(), // Apple Music ID when available, otherwise Spotify ID
  trackName: text('track_name').notNull(),
  artistName: text('artist_name').notNull(),
  albumName: text('album_name'),
  albumArtUrl: text('album_art_url'),
  durationMs: integer('duration_ms'),
  isrc: text('isrc'),
  position: integer('position').notNull(),
  sourceProvider: text('source_provider').notNull(),
  
  // Audio features for LLM context (0-100 scale for consistency)
  energy: integer('energy'), // 0-100 scale  
  valence: integer('valence'), // 0-100 scale (happiness/positivity)
  danceability: integer('danceability'), // 0-100 scale
  tempo: integer('tempo'), // BPM
  genre: text('genre'),
  
  addedAt: timestamp('added_at').defaultNow().notNull(),
});