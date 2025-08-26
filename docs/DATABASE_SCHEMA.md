# Database Schema Documentation

## Overview

The Blendify database is designed to comprehensively collect and store music data from multiple streaming providers (Spotify, Apple Music) using an **append-only**, **user-centric** approach.

## Core Principles

1. **User-Centric**: All music data is directly linked to users, not provider connections
2. **Append-Only**: Data is never deleted, only added with timestamps for historical tracking
3. **Provider-Agnostic**: Same schema supports multiple music providers
4. **Rich Metadata**: Full JSON metadata preserved from APIs for flexibility
5. **Comprehensive Coverage**: Collects ALL available data from each provider

## Table Structure

### Core Tables

#### `users`
Primary user accounts table supporting both password and OAuth authentication.
```sql
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    display_name text,
    password_hash text,              -- For email/password auth
    avatar_url text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);
```

#### `provider_connections`
OAuth connections to music streaming services.
```sql
CREATE TABLE provider_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,       -- enum: 'spotify', 'apple'
    provider_user_id text NOT NULL,
    access_token_encrypted text NOT NULL,
    refresh_token_encrypted text,
    token_expires_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);
```

### Music Data Tables

All music data tables follow consistent patterns:
- Direct `user_id` reference (not via provider_connections)
- `provider` enum field
- `fetched_at` timestamp for append-only tracking
- Rich `*_metadata` jsonb fields with original API responses

#### `user_top_tracks`
User's top tracks from streaming services across different time ranges.
```sql
CREATE TABLE user_top_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    track_id text NOT NULL,
    track_name text NOT NULL,
    artist_name text NOT NULL,
    album_name text,
    album_art_url text,
    duration_ms integer,
    isrc text,
    time_range time_range NOT NULL,   -- enum: 'short_term', 'medium_term', 'long_term'
    rank integer NOT NULL,            -- 1-50 ranking within time range
    track_metadata jsonb,             -- Full API response
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~150 records per user (50 tracks × 3 time ranges)

#### `user_top_artists`
User's top artists across different time ranges.
```sql
CREATE TABLE user_top_artists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    artist_id text NOT NULL,
    artist_name text NOT NULL,
    image_url text,
    genres jsonb,                     -- Array of genre strings
    popularity integer,
    follower_count integer,
    time_range time_range NOT NULL,
    rank integer NOT NULL,
    artist_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~150 records per user (50 artists × 3 time ranges)

#### `user_recently_played`
Recently played tracks with exact play timestamps.
```sql
CREATE TABLE user_recently_played (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    track_id text NOT NULL,
    track_name text NOT NULL,
    artist_name text NOT NULL,
    album_name text,
    album_art_url text,
    duration_ms integer,
    played_at timestamp NOT NULL,     -- When track was actually played
    isrc text,
    track_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~50 records per sync, grows over time

#### `user_playlists`
All user playlists (owned and followed).
```sql
CREATE TABLE user_playlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    playlist_id text NOT NULL,
    playlist_name text NOT NULL,
    description text,
    image_url text,
    track_count integer,
    follower_count integer,
    is_public boolean,
    is_owner boolean NOT NULL,        -- true if user owns, false if following
    owner_name text,
    playlist_url text,
    playlist_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~20-100 playlists per user

#### `user_playlist_tracks`
All tracks within user's playlists.
```sql
CREATE TABLE user_playlist_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    playlist_id text NOT NULL,        -- Links to playlist_id in user_playlists
    track_id text NOT NULL,
    track_name text NOT NULL,
    artist_name text NOT NULL,
    album_name text,
    album_art_url text,
    duration_ms integer,
    added_at timestamp,               -- When track was added to playlist
    added_by text,                    -- User ID who added the track
    isrc text,
    track_position integer,           -- Position within playlist
    track_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~1000-5000 tracks per user (varies greatly)

#### `user_saved_tracks`
User's saved/liked tracks.
```sql
CREATE TABLE user_saved_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    track_id text NOT NULL,
    track_name text NOT NULL,
    artist_name text NOT NULL,
    album_name text,
    album_art_url text,
    duration_ms integer,
    saved_at timestamp,               -- When user saved the track
    popularity integer,               -- Spotify popularity score (0-100)
    isrc text,
    track_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~500-2000 tracks per user

#### `user_saved_albums`
User's saved albums.
```sql
CREATE TABLE user_saved_albums (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    album_id text NOT NULL,
    album_name text NOT NULL,
    artist_name text NOT NULL,
    image_url text,
    release_date text,
    total_tracks integer,
    saved_at timestamp,
    album_type text,                  -- 'album', 'single', 'compilation'
    genres jsonb,
    album_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~100-500 albums per user

#### `user_followed_artists`
Artists that the user follows.
```sql
CREATE TABLE user_followed_artists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider provider NOT NULL,
    artist_id text NOT NULL,
    artist_name text NOT NULL,
    image_url text,
    genres jsonb,
    popularity integer,
    follower_count integer,
    artist_url text,
    artist_metadata jsonb,
    fetched_at timestamp NOT NULL DEFAULT now()
);
```

**Data Volume**: ~50-200 artists per user

### Blend Tables

#### `blends`
Created playlist blends combining multiple users' music.
```sql
CREATE TABLE blends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_by_user_id uuid NOT NULL REFERENCES users(id),
    algorithm_type text NOT NULL,     -- 'balanced', 'weighted', 'discovery'
    algorithm_config jsonb,           -- Algorithm parameters
    total_tracks integer DEFAULT 0,
    is_public boolean DEFAULT false,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);
```

#### `blend_participants`
Users participating in a blend.
```sql
CREATE TABLE blend_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blend_id uuid NOT NULL REFERENCES blends(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id),
    weight real DEFAULT 1.0,          -- Influence weight in blend algorithm
    joined_at timestamp NOT NULL DEFAULT now()
);
```

#### `blend_tracks`
Final tracks in generated blends.
```sql
CREATE TABLE blend_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blend_id uuid NOT NULL REFERENCES blends(id) ON DELETE CASCADE,
    track_id text NOT NULL,
    track_name text NOT NULL,
    artist_name text NOT NULL,
    album_name text,
    album_art_url text,
    duration_ms integer,
    position integer NOT NULL,
    source_provider provider NOT NULL,
    source_user_id uuid NOT NULL REFERENCES users(id),
    similarity_score real,            -- Algorithm confidence score
    blend_metadata jsonb,             -- Why this track was selected
    created_at timestamp NOT NULL DEFAULT now()
);
```

## Enums

```sql
-- Provider types
CREATE TYPE provider AS ENUM('spotify', 'apple');

-- Time ranges for top tracks/artists
CREATE TYPE time_range AS ENUM('short_term', 'medium_term', 'long_term');
```

## Indexes

Key indexes for performance:
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Provider connections
CREATE INDEX idx_provider_connections_user_provider ON provider_connections(user_id, provider);

-- Music data by user and provider
CREATE INDEX idx_user_top_tracks_user_provider ON user_top_tracks(user_id, provider);
CREATE INDEX idx_user_playlists_user_provider ON user_playlists(user_id, provider);

-- Time-based queries
CREATE INDEX idx_user_recently_played_played_at ON user_recently_played(played_at DESC);
CREATE INDEX idx_user_top_tracks_fetched_at ON user_top_tracks(fetched_at DESC);

-- Blend lookups
CREATE INDEX idx_blend_participants_blend_id ON blend_participants(blend_id);
CREATE INDEX idx_blend_tracks_blend_position ON blend_tracks(blend_id, position);
```

## Data Collection Strategy

### On User Authentication
1. **Password users**: No automatic data collection
2. **OAuth users**: Immediate comprehensive sync on first connection

### On Provider Connection
When a user connects a music service:
1. **Immediate sync**: All available data collected in background
2. **Append-only**: New data added, existing data preserved
3. **Comprehensive**: Every available endpoint called
4. **Robust**: Individual failures don't break entire sync

### Data Freshness
- **`fetched_at`**: Track when each piece of data was collected
- **Append-only**: Historical changes preserved
- **Re-sync**: Users can trigger fresh data collection

## Query Patterns

### Get user's complete music profile
```sql
SELECT 'top_tracks' as type, COUNT(*) as count FROM user_top_tracks WHERE user_id = $1
UNION ALL
SELECT 'playlists' as type, COUNT(*) FROM user_playlists WHERE user_id = $1
UNION ALL
SELECT 'saved_tracks' as type, COUNT(*) FROM user_saved_tracks WHERE user_id = $1;
```

### Find musical overlap between users
```sql
SELECT t1.track_id, t1.track_name, t1.artist_name
FROM user_top_tracks t1
JOIN user_top_tracks t2 ON t1.track_id = t2.track_id
WHERE t1.user_id = $1 AND t2.user_id = $2
  AND t1.provider = t2.provider;
```

### Get user's recent activity across all sources
```sql
SELECT track_name, artist_name, played_at, provider
FROM user_recently_played
WHERE user_id = $1
ORDER BY played_at DESC
LIMIT 50;
```

## Storage Estimates

For an active user with comprehensive music data:
- **Total records**: ~3,000-8,000 per user
- **Storage per user**: ~2-5 MB (including JSON metadata)
- **Growth rate**: +500-1000 records per re-sync

## Migration Strategy

Database schema changes are handled through Drizzle migrations:
1. Schema files in `db/schema/`
2. Migrations in `db/migrations/`
3. Append-only principle preserved across schema changes