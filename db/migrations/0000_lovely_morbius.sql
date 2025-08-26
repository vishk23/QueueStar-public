DO $$ BEGIN
 CREATE TYPE "public"."participant_status" AS ENUM('pending', 'accepted', 'declined');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."blend_status" AS ENUM('pending', 'processing', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."provider" AS ENUM('spotify', 'apple');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."spotify_time_range" AS ENUM('short_term', 'medium_term', 'long_term');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_playlist_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_playlist_id" text NOT NULL,
	"apple_track_id" text NOT NULL,
	"track_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"album_name" text NOT NULL,
	"duration_ms" integer,
	"album_art_url" text,
	"preview_url" text,
	"isrc" text,
	"content_rating" text,
	"genres" text[],
	"track_position" integer,
	"track_metadata" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_playlist_id" text NOT NULL,
	"playlist_name" text NOT NULL,
	"description" text,
	"image_url" text,
	"track_count" integer DEFAULT 0,
	"is_public" boolean,
	"curator_name" text,
	"playlist_type" text,
	"apple_url" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_recently_played" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_track_id" text NOT NULL,
	"track_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"album_name" text NOT NULL,
	"duration_ms" integer,
	"album_art_url" text,
	"preview_url" text,
	"isrc" text,
	"content_rating" text,
	"genres" text[],
	"played_at" timestamp NOT NULL,
	"context_type" text,
	"context_name" text,
	"context_apple_id" text,
	"track_metadata" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_top_artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_artist_id" text NOT NULL,
	"artist_name" text NOT NULL,
	"genres" text[],
	"image_url" text,
	"editorial_notes" text,
	"rotation_type" text DEFAULT 'heavy_rotation',
	"rank" integer NOT NULL,
	"artist_metadata" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_top_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_track_id" text NOT NULL,
	"track_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"album_name" text NOT NULL,
	"duration_ms" integer,
	"album_art_url" text,
	"preview_url" text,
	"isrc" text,
	"content_rating" text,
	"genres" text[],
	"rotation_type" text DEFAULT 'heavy_rotation',
	"rank" integer NOT NULL,
	"track_metadata" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_music_user_id" text,
	"storefront_id" text NOT NULL,
	"subscription_status" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blend_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blend_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "participant_status" DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp
);
--> statement-breakpoint
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
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
	"context_name" text,
	"context_spotify_id" text,
	"audio_features" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_playlist_tracks" ADD CONSTRAINT "apple_playlist_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_playlists" ADD CONSTRAINT "apple_playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_recently_played" ADD CONSTRAINT "apple_recently_played_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_top_artists" ADD CONSTRAINT "apple_top_artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_top_tracks" ADD CONSTRAINT "apple_top_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_user_profiles" ADD CONSTRAINT "apple_user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blend_participants" ADD CONSTRAINT "blend_participants_blend_id_blends_id_fk" FOREIGN KEY ("blend_id") REFERENCES "public"."blends"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blend_participants" ADD CONSTRAINT "blend_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blend_tracks" ADD CONSTRAINT "blend_tracks_blend_id_blends_id_fk" FOREIGN KEY ("blend_id") REFERENCES "public"."blends"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blend_tracks" ADD CONSTRAINT "blend_tracks_contributed_by_users_id_fk" FOREIGN KEY ("contributed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blends" ADD CONSTRAINT "blends_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_user_profiles" ADD CONSTRAINT "spotify_user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_top_tracks" ADD CONSTRAINT "spotify_top_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_top_artists" ADD CONSTRAINT "spotify_top_artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_playlists" ADD CONSTRAINT "spotify_playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_playlist_tracks" ADD CONSTRAINT "spotify_playlist_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spotify_recently_played" ADD CONSTRAINT "spotify_recently_played_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
