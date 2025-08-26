# Apple Music Integration Plan for Blendify

## Phase 1: Setup & Prerequisites ✅ TO DO

### 1.1 Apple Developer Account Setup
- [ ] Ensure Apple Developer Program membership ($100/year)
- [ ] Create MusicKit Identifier in Apple Developer Console
- [ ] Generate and download Private Key (.p8 file)
- [ ] Note down Team ID and Key ID
- [ ] Set up environment variables

### 1.2 Environment Configuration
- [ ] Add Apple Music environment variables to `.env.local`:
  ```bash
  APPLE_TEAM_ID=your_team_id
  APPLE_KEY_ID=your_key_id
  APPLE_PRIVATE_KEY=your_private_key_content
  APPLE_MUSICKIT_IDENTIFIER=your_musickit_id
  ```

### 1.3 Dependencies
- [ ] Install required packages:
  ```bash
  npm install jsonwebtoken
  ```

## Phase 2: Backend Implementation ✅ TO DO

### 2.1 JWT Token Generation Service
- [ ] Create `/lib/apple-music-jwt.ts` for server-side JWT generation
- [ ] Implement secure token generation with proper expiration
- [ ] Add token caching mechanism

### 2.2 API Routes
- [ ] Create `/api/auth/apple-music/token` - Developer token endpoint
- [ ] Create `/api/auth/apple-music/callback` - OAuth callback handler  
- [ ] Create `/api/auth/apple-music/route.ts` - OAuth initiation
- [ ] Update existing user routes to support Apple Music connections

### 2.3 Database Schema Updates
- [ ] Verify Apple Music tables are properly set up:
  - `apple_user_profiles`
  - `apple_top_tracks` 
  - `apple_top_artists`
  - `apple_playlists`
  - `apple_playlist_tracks`
  - `apple_recently_played`

## Phase 3: Frontend Integration ✅ TO DO

### 3.1 MusicKit JS v3 Setup
- [ ] Add MusicKit JS v3 script to app layout:
  ```html
  <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
  ```

### 3.2 Apple Music Provider
- [ ] Create `/lib/providers/apple-music.ts` following Spotify provider pattern
- [ ] Implement MusicKit v3 API methods:
  - User authorization
  - Library access (songs, playlists, artists, albums)
  - Search functionality
  - Playback control

### 3.3 Settings Page Integration  
- [ ] Add "Connect Apple Music" button in settings
- [ ] Handle authorization flow
- [ ] Display connection status
- [ ] Show error messages for failed connections

### 3.4 Dashboard Updates
- [ ] Update dashboard to show Apple Music connection status
- [ ] Display combined music service connections
- [ ] Update "Connect Your Music" section

## Phase 4: Data Synchronization ✅ TO DO

### 4.1 Apple Music Data Collection
- [ ] Implement comprehensive data sync similar to Spotify:
  - User library songs
  - User playlists and tracks
  - User's artists (followed)
  - Recently played tracks
  - User profile information

### 4.2 Background Sync Process
- [ ] Create background sync job for Apple Music data
- [ ] Implement rate limiting and error handling
- [ ] Add progress tracking and logging

### 4.3 Data Storage
- [ ] Map Apple Music API responses to database schema
- [ ] Handle incremental sync for performance
- [ ] Implement data deduplication

## Phase 5: User Experience Enhancements ✅ TO DO

### 5.1 Multi-Provider Support
- [ ] Update UI to handle multiple music providers
- [ ] Show combined music data from Spotify + Apple Music
- [ ] Allow users to choose preferred provider for playback

### 5.2 Blend Algorithm Updates
- [ ] Modify blend creation to include Apple Music data
- [ ] Handle cross-platform track matching
- [ ] Implement provider preference settings

### 5.3 Error Handling & UX
- [ ] Graceful handling of Apple Music subscription requirements
- [ ] Clear messaging for geographic restrictions
- [ ] Fallback UI for unsupported browsers

## Phase 6: Testing & Quality Assurance ✅ TO DO

### 6.1 Integration Testing
- [ ] Test OAuth flow end-to-end
- [ ] Test data synchronization accuracy
- [ ] Test error scenarios (expired tokens, network failures)
- [ ] Test with different subscription states

### 6.2 Browser Compatibility
- [ ] Test across browsers (Safari, Chrome, Firefox, Edge)
- [ ] Handle browser audio policy restrictions
- [ ] Test mobile browser compatibility

### 6.3 Security Testing
- [ ] Verify JWT token security
- [ ] Test token refresh mechanisms
- [ ] Audit data storage and transmission security

## Technical Implementation Details

### MusicKit JS v3 Key Differences from v1
1. **Single API Method**: v3 uses a unified 'passthrough' API approach
2. **Improved Headers**: Automatic header management 
3. **Better Error Handling**: Enhanced error reporting and handling
4. **TypeScript Support**: Better type definitions
5. **Modern JavaScript**: Updated for current web standards

### Integration Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Blendify UI   │    │   Backend APIs   │    │  Apple Music   │
│                 │    │                  │    │     APIs        │
│ - Settings Page │◄──►│ - JWT Generation │◄──►│ - Authentication│
│ - Dashboard     │    │ - OAuth Handler  │    │ - Library Access│  
│ - Blend Creator │    │ - Data Sync      │    │ - Search        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Security Considerations
- JWT tokens generated server-side only
- Private keys never exposed to client
- Secure token transmission over HTTPS
- Token expiration and refresh mechanisms
- User consent for data access

### Performance Considerations
- Background data sync to avoid blocking UI
- Rate limiting for API calls
- Efficient data storage and querying
- Caching strategies for frequently accessed data

## Success Metrics
- [ ] Successfully authenticate users with Apple Music
- [ ] Sync user's Apple Music library data 
- [ ] Create blended playlists using Apple Music + Spotify data
- [ ] Handle errors gracefully with clear user feedback
- [ ] Maintain good performance with large music libraries

## Dependencies & Requirements
- Apple Developer Program membership
- MusicKit JS v3 library
- Active Apple Music subscription (for users)
- HTTPS deployment (required for MusicKit)
- Modern browser support

This plan provides a comprehensive roadmap for integrating Apple Music into Blendify using MusicKit JS v3, following the same patterns established for Spotify integration.