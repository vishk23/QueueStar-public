# Blendify MVP Deployment - Quick Start

## 🚀 Quick Deployment (5 steps)

### 1. Create Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project" → Name it "blendify-prod" → Choose region → Create
3. Wait for project to be ready (2-3 minutes)

### 2. Migrate Database
```bash
# Copy your Supabase connection string from Settings → Database
export DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# Run migrations
npm run db:migrate
```

### 3. Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. **Don't deploy yet** - configure environment variables first

### 4. Set Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables:

**Required:**
```
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
SPOTIFY_CLIENT_ID = your_spotify_client_id
SPOTIFY_CLIENT_SECRET = your_spotify_client_secret
SPOTIFY_REDIRECT_URI = https://your-app.vercel.app/api/auth/spotify/callback
APPLE_TEAM_ID = your_apple_team_id
APPLE_KEY_ID = your_apple_key_id
APPLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----"
OPENAI_API_KEY = your_openai_key
JWT_SECRET = your_random_jwt_secret
ENCRYPTION_KEY = your_32_character_key
NEXTAUTH_URL = https://your-app.vercel.app
NEXTAUTH_SECRET = your_nextauth_secret
```

### 5. Update OAuth Settings
**Spotify:**
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → Your App → Edit Settings
2. Add redirect URI: `https://your-app.vercel.app/api/auth/spotify/callback`

**Apple Music:**
1. [Apple Developer Portal](https://developer.apple.com) → Your App
2. Add your Vercel domain to allowed origins

### 6. Deploy!
Click "Deploy" in Vercel and wait for build to complete.

## 🔧 Troubleshooting

**Build Issues:** The app has some TypeScript errors in test files. For MVP deployment, you can:
1. Temporarily exclude test files from build by updating `tsconfig.json`:
   ```json
   {
     "exclude": ["**/*.test.ts", "**/*.test.tsx", "__tests__/**/*"]
   }
   ```

**Database Issues:** Verify your DATABASE_URL is correct and migrations ran successfully.

**OAuth Issues:** Ensure redirect URIs match exactly between your OAuth apps and environment variables.

## 📋 Environment Variables Generator

Use this template for your Vercel environment variables:

```bash
# Copy from Supabase Dashboard → Settings → Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres

# Copy from Spotify Developer Dashboard  
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/auth/spotify/callback

# Copy from Apple Developer Account
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_here
-----END PRIVATE KEY-----"

# Copy from OpenAI Dashboard
OPENAI_API_KEY=sk-your_openai_key

# Generate random strings (use password generators)
JWT_SECRET=your_very_secure_random_string
ENCRYPTION_KEY=your_32_character_encryption_key
NEXTAUTH_SECRET=your_nextauth_secret

# Set to your Vercel domain
NEXTAUTH_URL=https://your-app.vercel.app
```

## ✅ Testing Deployment

After deployment, test these features:
1. User registration/login
2. Spotify OAuth connection
3. Apple Music OAuth connection  
4. Create a blend with friends
5. Generate blend tracks
6. Export to Apple Music

Your Blendify MVP should now be live! 🎉