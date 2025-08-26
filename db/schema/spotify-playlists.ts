import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const spotifyPlaylists = pgTable('spotify_playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Playlist details
  spotifyPlaylistId: text('spotify_playlist_id').notNull(),
  playlistName: text('playlist_name').notNull(),
  description: text('description'),
  
  // Playlist metadata
  imageUrl: text('image_url'),
  trackCount: integer('track_count').default(0),
  followerCount: integer('follower_count'),
  isPublic: boolean('is_public'),
  collaborative: boolean('collaborative').default(false),
  
  // Ownership
  ownerDisplayName: text('owner_display_name'),
  ownerSpotifyId: text('owner_spotify_id'),
  isOwnedByUser: boolean('is_owned_by_user').default(false),
  
  // URLs
  spotifyUrl: text('spotify_url'),
  
  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});