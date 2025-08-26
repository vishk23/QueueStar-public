-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE provider_type AS ENUM ('spotify', 'apple');
CREATE TYPE blend_mode AS ENUM ('interleave', 'weighted', 'discovery');

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE provider_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider provider_type NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    encrypted_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    is_expired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE TABLE user_top_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider provider_type NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artist_name VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    image_url TEXT,
    external_url TEXT,
    popularity INTEGER,
    duration_ms INTEGER,
    explicit BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,
    time_range VARCHAR(20) NOT NULL DEFAULT 'medium_term',
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, track_id, time_range)
);

CREATE TABLE blends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mode blend_mode DEFAULT 'interleave',
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    playlist_id VARCHAR(255),
    playlist_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE blend_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blend_id UUID NOT NULL REFERENCES blends(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) DEFAULT 1.0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blend_id, user_id)
);

CREATE TABLE blend_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blend_id UUID NOT NULL REFERENCES blends(id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(500) NOT NULL,
    artist_name VARCHAR(500) NOT NULL,
    album_name VARCHAR(500),
    image_url TEXT,
    external_url TEXT,
    contributor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blend_id, position)
);

-- Create indexes for better performance
CREATE INDEX idx_provider_connections_user_id ON provider_connections(user_id);
CREATE INDEX idx_provider_connections_provider ON provider_connections(provider);
CREATE INDEX idx_user_top_tracks_user_id ON user_top_tracks(user_id);
CREATE INDEX idx_user_top_tracks_provider ON user_top_tracks(provider);
CREATE INDEX idx_user_top_tracks_time_range ON user_top_tracks(time_range);
CREATE INDEX idx_blends_creator_id ON blends(creator_id);
CREATE INDEX idx_blends_is_public ON blends(is_public);
CREATE INDEX idx_blend_participants_blend_id ON blend_participants(blend_id);
CREATE INDEX idx_blend_participants_user_id ON blend_participants(user_id);
CREATE INDEX idx_blend_tracks_blend_id ON blend_tracks(blend_id);
CREATE INDEX idx_blend_tracks_position ON blend_tracks(blend_id, position);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_connections_updated_at BEFORE UPDATE ON provider_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blends_updated_at BEFORE UPDATE ON blends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();