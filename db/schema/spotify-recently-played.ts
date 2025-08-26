import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const spotifyRecentlyPlayed = pgTable('spotify_recently_played', {
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
  
  // Playback context
  playedAt: timestamp('played_at').notNull(), // When track was played
  contextType: text('context_type'), // 'playlist', 'album', 'artist'
  contextName: text('context_name'), // Name of the context
  contextSpotifyId: text('context_spotify_id'), // ID of the context
  
  // Audio features for trend analysis
  audioFeatures: jsonb('audio_features'),
  
  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});