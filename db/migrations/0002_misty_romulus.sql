CREATE TABLE IF NOT EXISTS "apple_heavy_rotation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_resource_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_name" text NOT NULL,
	"artist_name" text,
	"album_name" text,
	"play_count" integer,
	"rotation_score" numeric(5, 2),
	"last_played_at" timestamp,
	"first_played_at" timestamp,
	"duration_ms" integer,
	"album_art_url" text,
	"preview_url" text,
	"isrc" text,
	"content_rating" text,
	"genres" text[],
	"catalog_id" text,
	"is_recommended" text DEFAULT 'false',
	"recommendation_reason" text,
	"resource_metadata" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"sync_version" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apple_heavy_rotation" ADD CONSTRAINT "apple_heavy_rotation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
