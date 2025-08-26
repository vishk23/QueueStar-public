-- Create friends table
CREATE TABLE IF NOT EXISTS "friends" (
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"status" text DEFAULT 'accepted' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "friends_user_id_friend_id_pk" PRIMARY KEY("user_id","friend_id")
);

-- Create invites table  
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

-- Create apple_recommendations table
CREATE TABLE IF NOT EXISTS "apple_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apple_resource_id" text NOT NULL,
	"recommendation_type" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_name" text NOT NULL,
	"artist_name" text,
	"album_name" text,
	"album_art_url" text,
	"preview_url" text,
	"duration_ms" integer,
	"release_date" text,
	"genres" text[],
	"content_rating" text,
	"recommendation_reason" text,
	"confidence_score" numeric(3, 2),
	"catalog_id" text,
	"play_params" jsonb,
	"resource_metadata" jsonb,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "friends" ADD CONSTRAINT "friends_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "apple_recommendations" ADD CONSTRAINT "apple_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;