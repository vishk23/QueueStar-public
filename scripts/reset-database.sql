-- Reset all tables in the database
TRUNCATE TABLE 
    users,
    provider_connections,
    spotify_user_profiles,
    spotify_playlists,
    spotify_playlist_tracks,
    spotify_recently_played,
    spotify_top_tracks,
    spotify_top_artists,
    apple_user_profiles,
    apple_library_songs,
    apple_library_albums,
    apple_library_playlists,
    apple_library_playlist_tracks,
    apple_playlists,
    apple_playlist_tracks,
    apple_recently_played,
    apple_top_tracks,
    apple_top_artists,
    blends,
    blend_participants,
    blend_tracks
CASCADE;