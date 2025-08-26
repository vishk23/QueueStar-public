# Blendify Deployment Guide

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Push your code to GitHub

## Step 1: Deploy to Supabase

### 1.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Set project name: "blendify-production"
5. Choose a region close to your users
6. Generate a secure password
7. Click "Create new project"

### 1.2 Run Database Migrations
Once your project is ready:

```bash
# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
npm run db:migrate
```

### 1.3 Get Supabase Credentials
From your Supabase project dashboard:
- **Project URL**: Found in Settings → API
- **Anon Key**: Found in Settings → API (public)
- **Service Role Key**: Found in Settings → API (secret)

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Choose "blendify" repository

### 2.2 Configure Environment Variables
In Vercel project settings → Environment Variables, add:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/auth/spotify/callback

# Apple Music
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"

# OpenAI for blend generation
OPENAI_API_KEY=your_openai_api_key

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Encryption key for tokens (32-character string)
ENCRYPTION_KEY=your_32_character_encryption_key

# Next.js
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
```

### 2.3 Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Visit your deployed app

## Step 3: Update OAuth Redirect URIs

### 3.1 Spotify
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Add redirect URI: `https://your-app.vercel.app/api/auth/spotify/callback`

### 3.2 Apple Music
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Update your app configuration with production domain
3. Add your Vercel domain to allowed origins

## Step 4: Test Production Deployment

1. Visit your Vercel app URL
2. Test user registration
3. Test Spotify OAuth flow
4. Test Apple Music OAuth flow
5. Test blend creation
6. Test Apple Music export

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure migrations ran successfully

### OAuth Issues
- Verify redirect URIs match exactly
- Check client IDs and secrets
- Ensure environment variables are set

### Build Issues
- Run `npm run build` locally first
- Check TypeScript errors with `npm run type-check`
- Verify all environment variables are set in Vercel

## Environment Variables Template

Create this file as `.env.example` for reference:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/blendify

# Spotify OAuth
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback

# Apple Music
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# OpenAI
OPENAI_API_KEY=

# Security
JWT_SECRET=
ENCRYPTION_KEY=

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

## Post-Deployment Checklist

- [ ] Database migrations successful
- [ ] User registration works
- [ ] Spotify OAuth works
- [ ] Apple Music OAuth works
- [ ] Blend creation works
- [ ] Apple Music export works
- [ ] All environment variables set
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)