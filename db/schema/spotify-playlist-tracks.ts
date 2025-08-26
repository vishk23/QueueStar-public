import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const spotifyPlaylistTracks = pgTable('spotify_playlist_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Playlist reference
  spotifyPlaylistId: text('spotify_playlist_id').notNull(),
  
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
  
  // Playlist context
  addedAt: timestamp('added_at'), // When track was added to playlist
  addedBySpotifyId: text('added_by_spotify_id'), // Who added it
  trackPosition: integer('track_position'), // Position in playlist
  
  // Audio features for blending
  audioFeatures: jsonb('audio_features'), // Energy, valence, etc.
  
  // Timestamps  
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});