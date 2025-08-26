import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const spotifyTimeRangeEnum = pgEnum('spotify_time_range', ['short_term', 'medium_term', 'long_term']);

export const spotifyTopTracks = pgTable('spotify_top_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Track details
  spotifyTrackId: text('spotify_track_id').notNull(),
  trackName: text('track_name').notNull(),
  artistName: text('artist_name').notNull(),
  albumName: text('album_name').notNull(),
  
  // Track metadata
  durationMs: integer('duration_ms'),
  popularity: integer('popularity'),
  albumArtUrl: text('album_art_url'),
  previewUrl: text('preview_url'),
  isrc: text('isrc'),
  
  // Ranking info
  timeRange: spotifyTimeRangeEnum('time_range').notNull(),
  rank: integer('rank').notNull(), // 1-50
  
  // Audio features (can be fetched separately)
  audioFeatures: jsonb('audio_features'), // Energy, danceability, etc.
  
  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});