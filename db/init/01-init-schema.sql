-- Queue Star Database Initialization
-- This script combines all migrations for Docker setup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "provider" AS ENUM('spotify', 'apple');
CREATE TYPE "blend_status" AS ENUM('pending', 'processing', 'completed');
CREATE TYPE "spotify_time_range" AS ENUM('short_term', 'medium_term', 'long_term');

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "display_name" text,
    "password_hash" text,
    "avatar_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Provider connections table
CREATE TABLE IF NOT EXISTS "provider_connections" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "provider" "provider" NOT NULL,
    "provider_user_id" text NOT NULL,
    "access_token_encrypted" text NOT NULL,
    "refresh_token_encrypted" text,
    "token_expires_at" timestamp,
    "provider_metadata" jsonb,
    "last_sync_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Blends table
CREATE TABLE IF NOT EXISTS "blends" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_by" uuid NOT NULL,
    "name" text NOT NULL,
    "share_code" text NOT NULL,
    "status" "blend_status" DEFAULT 'pending' NOT NULL,
    "blend_settings" jsonb DEFAULT '{}',
    "playlist_spotify_id" text,
    "playlist_apple_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp,
    CONSTRAINT "blends_share_code_unique" UNIQUE("share_code")
);

-- Blend participants table
CREATE TABLE IF NOT EXISTS "blend_participants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "blend_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "joined_at" timestamp DEFAULT now() NOT NULL
);

-- Blend tracks table
CREATE TABLE IF NOT EXISTS "blend_tracks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "blend_id" uuid NOT NULL,
    "contributed_by" uuid NOT NULL,
    "track_id" text NOT NULL,
    "track_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_name" text,
    "album_art_url" text,
    "duration_ms" integer,
    "isrc" text,
    "position" integer NOT NULL,
    "source_provider" text NOT NULL,
    "energy" integer,
    "valence" integer,
    "danceability" integer,
    "tempo" integer,
    "genre" text,
    "added_at" timestamp DEFAULT now() NOT NULL
);

-- Spotify user profiles
CREATE TABLE IF NOT EXISTS "spotify_user_profiles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "spotify_id" text NOT NULL,
    "display_name" text NOT NULL,
    "email" text,
    "image_url" text,
    "country" text,
    "product" text,
    "follower_count" text,
    "connected_at" timestamp DEFAULT now() NOT NULL,
    "last_synced_at" timestamp,
    CONSTRAINT "spotify_user_profiles_spotify_id_unique" UNIQUE("spotify_id")
);

-- Spotify top tracks
CREATE TABLE IF NOT EXISTS "spotify_top_tracks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "spotify_track_id" text NOT NULL,
    "track_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_name" text NOT NULL,
    "duration_ms" integer,
    "popularity" integer,
    "album_art_url" text,
    "preview_url" text,
    "isrc" text,
    "time_range" "spotify_time_range" NOT NULL,
    "rank" integer NOT NULL,
    "audio_features" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

-- Spotify top artists
CREATE TABLE IF NOT EXISTS "spotify_top_artists" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "spotify_artist_id" text NOT NULL,
    "artist_name" text NOT NULL,
    "genres" text[],
    "popularity" integer,
    "image_url" text,
    "follower_count" integer,
    "time_range" "spotify_time_range" NOT NULL,
    "rank" integer NOT NULL,
    "artist_metadata" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

-- Spotify playlists
CREATE TABLE IF NOT EXISTS "spotify_playlists" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "spotify_playlist_id" text NOT NULL,
    "playlist_name" text NOT NULL,
    "description" text,
    "image_url" text,
    "track_count" integer DEFAULT 0,
    "follower_count" integer,
    "is_public" boolean,
    "collaborative" boolean DEFAULT false,
    "owner_display_name" text,
    "owner_spotify_id" text,
    "is_owned_by_user" boolean DEFAULT false,
    "spotify_url" text,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

-- Spotify playlist tracks
CREATE TABLE IF NOT EXISTS "spotify_playlist_tracks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "spotify_playlist_id" text NOT NULL,
    "spotify_track_id" text NOT NULL,
    "track_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_name" text NOT NULL,
    "duration_ms" integer,
    "popularity" integer,
    "album_art_url" text,
    "preview_url" text,
    "isrc" text,
    "added_at" timestamp,
    "added_by_spotify_id" text,
    "track_position" integer,
    "audio_features" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

-- Spotify recently played
CREATE TABLE IF NOT EXISTS "spotify_recently_played" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "spotify_track_id" text NOT NULL,
    "track_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_name" text NOT NULL,
    "duration_ms" integer,
    "popularity" integer,
    "album_art_url" text,
    "preview_url" text,
    "isrc" text,
    "played_at" timestamp NOT NULL,
    "context_type" text,
    "context_uri" text,
    "audio_features" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

-- Apple Music tables
CREATE TABLE IF NOT EXISTS "apple_user_profiles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "apple_music_user_token" text NOT NULL,
    "storefront" text NOT NULL,
    "connected_at" timestamp DEFAULT now() NOT NULL,
    "last_synced_at" timestamp
);

CREATE TABLE IF NOT EXISTS "apple_library_songs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "apple_catalog_id" text NOT NULL,
    "track_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_name" text,
    "album_art_url" text,
    "preview_url" text,
    "duration_ms" integer,
    "release_date" text,
    "genres" text[],
    "content_rating" text,
    "isrc" text,
    "play_params" jsonb,
    "library_metadata" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "apple_library_albums" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "apple_catalog_id" text NOT NULL,
    "album_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_art_url" text,
    "track_count" integer,
    "release_date" text,
    "genres" text[],
    "content_rating" text,
    "copyright" text,
    "editorial_notes" text,
    "play_params" jsonb,
    "library_metadata" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "apple_library_playlists" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "apple_playlist_id" text NOT NULL,
    "playlist_name" text NOT NULL,
    "description" text,
    "playlist_art_url" text,
    "track_count" integer DEFAULT 0,
    "is_public" boolean DEFAULT false,
    "curator_name" text,
    "last_modified_date" text,
    "play_params" jsonb,
    "playlist_metadata" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "apple_library_playlist_tracks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "apple_playlist_id" text NOT NULL,
    "apple_catalog_id" text NOT NULL,
    "track_name" text NOT NULL,
    "artist_name" text NOT NULL,
    "album_name" text,
    "album_art_url" text,
    "preview_url" text,
    "duration_ms" integer,
    "track_position" integer,
    "date_added" text,
    "play_params" jsonb,
    "track_metadata" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "apple_heavy_rotation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "apple_resource_id" text NOT NULL,
    "resource_type" text NOT NULL,
    "resource_name" text NOT NULL,
    "artist_name" text,
    "album_name" text,
    "album_art_url" text,
    "preview_url" text,
    "duration_ms" integer,
    "genres" text[],
    "content_rating" text,
    "play_count" integer,
    "date_reached" text,
    "play_params" jsonb,
    "resource_metadata" jsonb,
    "fetched_at" timestamp DEFAULT now() NOT NULL,
    "last_updated_at" timestamp DEFAULT now() NOT NULL
);

-- Friends table
CREATE TABLE IF NOT EXISTS "friends" (
    "user_id" uuid NOT NULL,
    "friend_id" uuid NOT NULL,
    "requested_by" uuid NOT NULL,
    "status" text DEFAULT 'accepted' NOT NULL,
    "requested_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "friends_user_id_friend_id_pk" PRIMARY KEY("user_id","friend_id")
);

-- Invites table
CREATE TABLE IF NOT EXISTS "invites" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "code" text NOT NULL UNIQUE,
    "created_by" uuid NOT NULL,
    "used_by" uuid,
    "used_count" integer DEFAULT 0,
    "max_uses" integer DEFAULT 1,
    "expires_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "used_at" timestamp
);

-- Add foreign key constraints
DO $$ BEGIN
    -- Users constraints
    ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blends" ADD CONSTRAINT "blends_created_by_users_id_fk" 
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blend_participants" ADD CONSTRAINT "blend_participants_blend_id_blends_id_fk" 
        FOREIGN KEY ("blend_id") REFERENCES "public"."blends"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blend_participants" ADD CONSTRAINT "blend_participants_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blend_tracks" ADD CONSTRAINT "blend_tracks_blend_id_blends_id_fk" 
        FOREIGN KEY ("blend_id") REFERENCES "public"."blends"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blend_tracks" ADD CONSTRAINT "blend_tracks_contributed_by_users_id_fk" 
        FOREIGN KEY ("contributed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add remaining foreign key constraints for all tables
DO $$ BEGIN
    ALTER TABLE "spotify_user_profiles" ADD CONSTRAINT "spotify_user_profiles_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "spotify_top_tracks" ADD CONSTRAINT "spotify_top_tracks_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "spotify_top_artists" ADD CONSTRAINT "spotify_top_artists_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "spotify_playlists" ADD CONSTRAINT "spotify_playlists_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "spotify_playlist_tracks" ADD CONSTRAINT "spotify_playlist_tracks_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "spotify_recently_played" ADD CONSTRAINT "spotify_recently_played_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Apple Music foreign keys
DO $$ BEGIN
    ALTER TABLE "apple_user_profiles" ADD CONSTRAINT "apple_user_profiles_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "apple_library_songs" ADD CONSTRAINT "apple_library_songs_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "apple_library_albums" ADD CONSTRAINT "apple_library_albums_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "apple_library_playlists" ADD CONSTRAINT "apple_library_playlists_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "apple_library_playlist_tracks" ADD CONSTRAINT "apple_library_playlist_tracks_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "apple_heavy_rotation" ADD CONSTRAINT "apple_heavy_rotation_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Friends and invites foreign keys
DO $$ BEGIN
    ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "friends" ADD CONSTRAINT "friends_friend_id_users_id_fk" 
        FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" 
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_users_id_fk" 
        FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;