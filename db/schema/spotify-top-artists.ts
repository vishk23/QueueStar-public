import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { spotifyTimeRangeEnum } from './spotify-top-tracks';

export const spotifyTopArtists = pgTable('spotify_top_artists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Artist details
  spotifyArtistId: text('spotify_artist_id').notNull(),
  artistName: text('artist_name').notNull(),
  
  // Artist metadata
  genres: text('genres').array(), // Array of genre strings
  popularity: integer('popularity'),
  imageUrl: text('image_url'),
  followerCount: integer('follower_count'),
  
  // Ranking info
  timeRange: spotifyTimeRangeEnum('time_range').notNull(),
  rank: integer('rank').notNull(), // 1-50
  
  // Rich metadata
  artistMetadata: jsonb('artist_metadata'), // Full Spotify artist object
  
  // Timestamps
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});