CREATE TABLE IF NOT EXISTS "apple_library_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_album_id" text NOT NULL,
	"album_type" text DEFAULT 'library-albums' NOT NULL,
	"album_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"release_date" text,
	"track_count" integer,
	"genre_names" text[],
	"artwork_url" text,
	"artwork_width" integer,
	"artwork_height" integer,
	"raw_data_record" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_library_playlist_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_playlist_id" text NOT NULL,
	"apple_track_id" text NOT NULL,
	"track_type" text DEFAULT 'library-songs' NOT NULL,
	"track_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"album_name" text NOT NULL,
	"duration_ms" integer,
	"track_number" integer,
	"disc_number" integer,
	"release_date" text,
	"has_lyrics" boolean,
	"content_rating" text,
	"genre_names" text[],
	"artwork_url" text,
	"artwork_width" integer,
	"artwork_height" integer,
	"catalog_id" text,
	"play_params_id" text,
	"is_library" boolean DEFAULT true,
	"play_params_kind" text,
	"track_position" integer,
	"raw_data_record" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_library_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_playlist_id" text NOT NULL,
	"playlist_type" text DEFAULT 'library-playlists' NOT NULL,
	"playlist_name" text NOT NULL,
	"description" text,
	"track_count" integer DEFAULT 0,
	"can_edit" boolean,
	"artwork_url" text,
	"artwork_width" integer,
	"artwork_height" integer,
	"raw_data_record" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apple_library_songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_track_id" text NOT NULL,
	"track_type" text DEFAULT 'library-songs' NOT NULL,
	"track_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"album_name" text NOT NULL,
	"duration_ms" integer,
	"track_number" integer,
	"disc_number" integer,
	"release_date" text,
	"has_lyrics" boolean,
	"content_rating" text,
	"genre_names" text[],
	"artwork_url" text,
	"artwork_width" integer,
	"artwork_height" integer,
	"catalog_id" text,
	"play_params_id" text,
	"is_library" boolean DEFAULT true,
	"play_params_kind" text,
	"raw_data_record" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_library_albums" ADD CONSTRAINT "apple_library_albums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_library_playlist_tracks" ADD CONSTRAINT "apple_library_playlist_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_library_playlists" ADD CONSTRAINT "apple_library_playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_library_songs" ADD CONSTRAINT "apple_library_songs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
