import { relations } from 'drizzle-orm';

// Core tables
import { users } from './users';
import { providerConnections } from './provider-connections';

// Spotify tables
import { spotifyUserProfiles } from './spotify-user-profiles';
import { spotifyTopTracks } from './spotify-top-tracks';
import { spotifyTopArtists } from './spotify-top-artists';
import { spotifyPlaylists } from './spotify-playlists';
import { spotifyPlaylistTracks } from './spotify-playlist-tracks';
import { spotifyRecentlyPlayed } from './spotify-recently-played';

// Apple Music tables
import { appleUserProfiles } from './apple-user-profiles';
import { appleHeavyRotation } from './apple-heavy-rotation';
import { appleRecommendations } from './apple-recommendations';

// Apple Music Library tables (MusicKit JS)
import { appleLibrarySongs } from './apple-library-songs';
import { appleLibraryAlbums } from './apple-library-albums';
import { appleLibraryPlaylists } from './apple-library-playlists';
import { appleLibraryPlaylistTracks } from './apple-library-playlist-tracks';

// Friends and invites
import { friends } from './friends';
import { invites } from './invites';

// Blending tables
import { blends } from './blends';
import { blendParticipants } from './blend-participants';
import { blendTracks } from './blend-tracks';

// ============================================================================
// USER RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  // Core connections
  providerConnections: many(providerConnections),
  
  // Spotify data
  spotifyProfile: many(spotifyUserProfiles),
  spotifyTopTracks: many(spotifyTopTracks),
  spotifyTopArtists: many(spotifyTopArtists),
  spotifyPlaylists: many(spotifyPlaylists),
  spotifyPlaylistTracks: many(spotifyPlaylistTracks),
  spotifyRecentlyPlayed: many(spotifyRecentlyPlayed),
  
  // Apple Music data
  appleProfile: many(appleUserProfiles),
  appleHeavyRotation: many(appleHeavyRotation),
  appleRecommendations: many(appleRecommendations),
  
  // Apple Music Library data (MusicKit JS)
  appleLibrarySongs: many(appleLibrarySongs),
  appleLibraryAlbums: many(appleLibraryAlbums),
  appleLibraryPlaylists: many(appleLibraryPlaylists),
  appleLibraryPlaylistTracks: many(appleLibraryPlaylistTracks),
  
  // Friends and invites
  friendships: many(friends, { relationName: 'userFriends' }),
  friendOf: many(friends, { relationName: 'friendOfUser' }),
  createdInvites: many(invites, { relationName: 'inviteCreator' }),
  usedInvites: many(invites, { relationName: 'inviteUser' }),
  
  // Blending
  createdBlends: many(blends),
  blendParticipations: many(blendParticipants),
}));

// ============================================================================
// CORE SYSTEM RELATIONS
// ============================================================================

export const providerConnectionsRelations = relations(providerConnections, ({ one }) => ({
  user: one(users, {
    fields: [providerConnections.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// SPOTIFY RELATIONS
// ============================================================================

export const spotifyUserProfilesRelations = relations(spotifyUserProfiles, ({ one }) => ({
  user: one(users, {
    fields: [spotifyUserProfiles.userId],
    references: [users.id],
  }),
}));

export const spotifyTopTracksRelations = relations(spotifyTopTracks, ({ one }) => ({
  user: one(users, {
    fields: [spotifyTopTracks.userId],
    references: [users.id],
  }),
}));

export const spotifyTopArtistsRelations = relations(spotifyTopArtists, ({ one }) => ({
  user: one(users, {
    fields: [spotifyTopArtists.userId],
    references: [users.id],
  }),
}));

export const spotifyPlaylistsRelations = relations(spotifyPlaylists, ({ one }) => ({
  user: one(users, {
    fields: [spotifyPlaylists.userId],
    references: [users.id],
  }),
}));

export const spotifyPlaylistTracksRelations = relations(spotifyPlaylistTracks, ({ one }) => ({
  user: one(users, {
    fields: [spotifyPlaylistTracks.userId],
    references: [users.id],
  }),
}));

export const spotifyRecentlyPlayedRelations = relations(spotifyRecentlyPlayed, ({ one }) => ({
  user: one(users, {
    fields: [spotifyRecentlyPlayed.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// APPLE MUSIC RELATIONS
// ============================================================================

export const appleUserProfilesRelations = relations(appleUserProfiles, ({ one }) => ({
  user: one(users, {
    fields: [appleUserProfiles.userId],
    references: [users.id],
  }),
}));

export const appleHeavyRotationRelations = relations(appleHeavyRotation, ({ one }) => ({
  user: one(users, {
    fields: [appleHeavyRotation.userId],
    references: [users.id],
  }),
}));

export const appleRecommendationsRelations = relations(appleRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [appleRecommendations.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// APPLE MUSIC LIBRARY RELATIONS (MusicKit JS)
// ============================================================================

export const appleLibrarySongsRelations = relations(appleLibrarySongs, ({ one }) => ({
  user: one(users, {
    fields: [appleLibrarySongs.userId],
    references: [users.id],
  }),
}));

export const appleLibraryAlbumsRelations = relations(appleLibraryAlbums, ({ one }) => ({
  user: one(users, {
    fields: [appleLibraryAlbums.userId],
    references: [users.id],
  }),
}));

export const appleLibraryPlaylistsRelations = relations(appleLibraryPlaylists, ({ one }) => ({
  user: one(users, {
    fields: [appleLibraryPlaylists.userId],
    references: [users.id],
  }),
}));

export const appleLibraryPlaylistTracksRelations = relations(appleLibraryPlaylistTracks, ({ one }) => ({
  user: one(users, {
    fields: [appleLibraryPlaylistTracks.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// BLENDING RELATIONS
// ============================================================================

export const blendsRelations = relations(blends, ({ one, many }) => ({
  creator: one(users, {
    fields: [blends.createdBy],
    references: [users.id],
  }),
  participants: many(blendParticipants),
  tracks: many(blendTracks),
}));

export const blendParticipantsRelations = relations(blendParticipants, ({ one }) => ({
  blend: one(blends, {
    fields: [blendParticipants.blendId],
    references: [blends.id],
  }),
  user: one(users, {
    fields: [blendParticipants.userId],
    references: [users.id],
  }),
}));


// ============================================================================
// FRIENDS AND INVITES RELATIONS
// ============================================================================

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
    relationName: 'userFriends'
  }),
  friend: one(users, {
    fields: [friends.friendId],
    references: [users.id],
    relationName: 'friendOfUser'
  }),
  requestedByUser: one(users, {
    fields: [friends.requestedBy],
    references: [users.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  creator: one(users, {
    fields: [invites.createdBy],
    references: [users.id],
    relationName: 'inviteCreator'
  }),
  user: one(users, {
    fields: [invites.usedBy],
    references: [users.id],
    relationName: 'inviteUser'
  }),
}));

export const blendTracksRelations = relations(blendTracks, ({ one }) => ({
  blend: one(blends, {
    fields: [blendTracks.blendId],
    references: [blends.id],
  }),
  contributedBy: one(users, {
    fields: [blendTracks.contributedBy],
    references: [users.id],
  }),
}));