# CLAUDE.md - Project Context for AI Assistant

## Project Overview
Blendify is a music blending application that allows users to create shared playlists by combining their music tastes with friends. Users authenticate with email/password, then link their Spotify and/or Apple Music accounts to sync their music data.

## Core Requirements
- **Full Data Sync**: Store ALL accessible data from linked music accounts (this is a hard requirement)
- **Multi-Provider Support**: Support both Spotify and Apple Music
- **Friend Blending**: Users can add friends and create blended playlists
- **MVP Focus**: While comprehensive in data collection, keep other aspects simple

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Custom email/password + OAuth for music providers
- **State**: React Query + Zustand

## Database Architecture
- **Append-only design**: Never delete data, track with timestamps
- **Comprehensive schema**: Separate tables for each data type from each provider
- **User-centric**: All music data linked directly to users

## Key Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run type-check   # TypeScript validation
npm run lint         # ESLint check

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Drizzle Studio UI

# Testing
npm test            # Run Vitest tests
npm run test:e2e    # Run Playwright tests
```

## Current Status
- ✅ Email/password authentication working
- ✅ Spotify OAuth and full data sync implemented
- ✅ Apple Music OAuth and data sync implemented (MusicKit JS)
- ✅ Friend system implemented (add/remove friends, search users, invite links)
- ✅ Blend creation algorithm implemented (LLM-powered with GPT-4o, 55-track generation)
- ✅ Apple Music-style blend display UI with beautiful track listing
- ✅ Apple Music export functionality (working but has some bugs - playlist creation works, track matching needs refinement)
- ⏳ UI for viewing synced data pending

## API Endpoints
- `/api/auth/login` - Email/password login
- `/api/auth/signup` - User registration
- `/api/auth/spotify` - Spotify OAuth initiation
- `/api/auth/spotify/callback` - Spotify OAuth callback with data sync
- `/api/auth/apple` - Apple Music OAuth (implemented)
- `/api/auth/apple/token` - Generate Apple Music developer token for MusicKit JS
- `/api/blends/create` - Create new blends with friend selection
- `/api/blends/list` - List user's blends
- `/api/blends/[id]/tracks` - Get blend tracks and details
- `/api/blends/[id]/generate` - Generate AI-powered blend using GPT-4o
- `/api/blends/[id]/export-apple` - Prepare blend data for Apple Music export
- `/api/friends/search` - Search for users to add as friends
- `/api/friends/add` - Send friend request
- `/api/friends/remove` - Remove friend
- `/api/friends/list` - List user's friends
- `/api/invites/create` - Create invite links for auto-friending
- `/api/user` - User profile management

## Environment Variables Required
```
DATABASE_URL=postgresql://...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY=...
OPENAI_API_KEY=...  # Required for blend generation with GPT-4o
```

## Development Workflow
1. Always run type-check and lint before committing
2. Database schema changes go in `/db/schema/`
3. Use Drizzle Kit for migrations
4. API routes use Next.js App Router conventions
5. Keep components in `/components/ui/` for reusability

## Known Issues
- PKCE cookie validation temporarily disabled for local development
- Apple Music export has some bugs (playlist creation works, but track matching/addition needs refinement)
- Placeholder album artwork shows 404 errors (non-critical)
- No UI for viewing synced music data yet
- Blend generation occasionally fails if no tracks found for users

## Architecture Decisions
- **Why separate tables per provider**: Allows provider-specific fields and easier querying
- **Why append-only**: Preserves historical data for better blend algorithms
- **Why comprehensive sync**: Better blend quality with more data points
- **Why custom auth**: Flexibility for email users who might not have music accounts yet

## Next Steps Priority
1. Fix Apple Music export bugs (improve track matching accuracy, handle edge cases)
2. Create UI to display synced music data (user library browser)
3. Implement Spotify playlist export functionality 
4. Add playlist artwork generation
5. Improve blend algorithm (better genre balancing, tempo progression)
6. Add blend sharing and collaborative editing features

## Recent Implementation Notes (for future developers/AI agents)

### Blend Generation System (December 2024)
- **Architecture**: LLM-powered using OpenAI GPT-4o for intelligent track curation
- **Algorithm**: Hybrid approach combining round-robin participant selection with AI optimization
- **Target**: 55 tracks per blend (matching typical playlist length)
- **Data Source**: Uses existing synced music data from `lib/blend/track-collection.ts`
- **Key Files**: 
  - `lib/blend/llm-generation.ts` - Core LLM integration
  - `lib/blend/track-collection.ts` - Data collection from synced libraries
  - `app/api/blends/[id]/generate/route.ts` - Generation endpoint

### Apple Music Export System (December 2024)
- **Architecture**: Uses MusicKit JS with direct HTTP requests to Apple Music API
- **Status**: Working but buggy - playlist creation works, track search/addition needs refinement
- **Authentication**: Uses Apple developer token + user token via MusicKit JS
- **Key Files**:
  - `lib/apple-music-export.ts` - Export functionality
  - `app/api/blends/[id]/export-apple/route.ts` - Data preparation endpoint
  - `app/(authenticated)/blends/[id]/page.tsx` - UI with conditional MusicKit loading
- **Known Issues**: Track matching accuracy could be improved, some API calls may fail

### Friend System (December 2024)
- **Database**: Friends table with composite primary key (userId, friendId)
- **Features**: Search users, send friend requests, invite links for auto-friending
- **Status**: Fully working
- **Key Files**: All friend-related APIs in `app/api/friends/` directory

### Critical Database Schema Notes
- Fixed field name mismatches that caused 0 tracks in blend generation:
  - Spotify: `trackId` → `spotifyTrackId` 
  - Apple heavy rotation: `name` → `resourceName`, `artworkUrl` → `albumArtUrl`
  - Apple library: `name` → `trackName`
- Always verify actual database field names before implementing new features