import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appleLibraryPlaylists = pgTable('apple_library_playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Apple Music library playlist ID (MusicKit JS format)
  applePlaylistId: text('apple_playlist_id').notNull(),
  playlistType: text('playlist_type').default('library-playlists').notNull(),
  
  // Core playlist details
  playlistName: text('playlist_name').notNull(),
  description: text('description'),
  
  // Playlist metadata from MusicKit JS
  trackCount: integer('track_count').default(0),
  canEdit: boolean('can_edit'), // Whether user can modify this playlist
  
  // Artwork (from MusicKit JS artwork object)
  artworkUrl: text('artwork_url'),
  artworkWidth: integer('artwork_width'),
  artworkHeight: integer('artwork_height'),
  
  // Full MusicKit JS DataRecord object for future use
  rawDataRecord: jsonb('raw_data_record'),
  
  // Timestamps for sync tracking
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow().notNull(),
});