import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appleLibraryPlaylistTracks = pgTable('apple_library_playlist_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Playlist reference
  applePlaylistId: text('apple_playlist_id').notNull(),
  
  // Apple Music library track details (MusicKit JS format)
  appleTrackId: text('apple_track_id').notNull(),
  trackType: text('track_type').default('library-songs').notNull(),
  
  // Core track details
  trackName: text('track_name').notNull(),
  artistName: text('artist_name').notNull(),
  albumName: text('album_name').notNull(),
  
  // Track metadata from MusicKit JS
  durationMs: integer('duration_ms'),
  trackNumber: integer('track_number'),
  discNumber: integer('disc_number'),
  releaseDate: text('release_date'),
  
  // Content attributes
  hasLyrics: boolean('has_lyrics'),
  contentRating: text('content_rating'), // 'clean', 'explicit'
  genreNames: text('genre_names').array(),
  
  // Artwork (from MusicKit JS artwork object)
  artworkUrl: text('artwork_url'),
  artworkWidth: integer('artwork_width'),
  artworkHeight: integer('artwork_height'),
  
  // Play parameters (for playback)
  catalogId: text('catalog_id'),
  playParamsId: text('play_params_id'),
  isLibrary: boolean('is_library').default(true),
  playParamsKind: text('play_params_kind'),
  
  // Playlist context
  trackPosition: integer('track_position'), // Position in playlist
  
  // Full MusicKit JS DataRecord object for future use
  rawDataRecord: jsonb('raw_data_record'),
  
  // Timestamps for sync tracking
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow().notNull(),
});