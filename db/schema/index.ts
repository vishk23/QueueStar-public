// Core system tables
export * from './users';
export * from './provider-connections';

// Spotify tables
export * from './spotify-user-profiles';
export * from './spotify-top-tracks';
export * from './spotify-top-artists';
export * from './spotify-playlists';
export * from './spotify-playlist-tracks';
export * from './spotify-recently-played';

// Apple Music tables
export * from './apple-user-profiles';
export * from './apple-heavy-rotation';
export * from './apple-recommendations';

// Apple Music Library tables (MusicKit JS)
export * from './apple-library-songs';
export * from './apple-library-albums';
export * from './apple-library-playlists';
export * from './apple-library-playlist-tracks';

// Friends and invites
export * from './friends';
export * from './invites';

// Blending system
export * from './blends';
export * from './blend-participants';
export * from './blend-tracks';

// Relations
export * from './relations';