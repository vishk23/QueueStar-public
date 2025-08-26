-- Add audio features columns to blend_tracks table
ALTER TABLE "blend_tracks" ADD COLUMN "energy" integer;
ALTER TABLE "blend_tracks" ADD COLUMN "valence" integer;
ALTER TABLE "blend_tracks" ADD COLUMN "danceability" integer;
ALTER TABLE "blend_tracks" ADD COLUMN "tempo" integer;
ALTER TABLE "blend_tracks" ADD COLUMN "genre" text;