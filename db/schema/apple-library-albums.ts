import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const appleLibraryAlbums = pgTable('apple_library_albums', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Apple Music library album ID (MusicKit JS format)
  appleAlbumId: text('apple_album_id').notNull(),
  albumType: text('album_type').default('library-albums').notNull(),
  
  // Core album details
  albumName: text('album_name').notNull(),
  artistName: text('artist_name').notNull(),
  
  // Album metadata from MusicKit JS
  releaseDate: text('release_date'),
  trackCount: integer('track_count'),
  genreNames: text('genre_names').array(),
  
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