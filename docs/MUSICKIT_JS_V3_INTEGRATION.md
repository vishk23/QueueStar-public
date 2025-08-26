# MusicKit JS v3 Integration Guide

## Overview

MusicKit JS v3 is Apple's latest JavaScript library that allows web applications to integrate Apple Music functionality, including playback, catalog search, and user library access. This guide covers the complete integration process for Blendify.

**Important Notes**: 
- MusicKit JS v3 represents a paradigm shift from v1, using a single 'passthrough' API method (`music()`) instead of individual endpoint methods
- **Beta Status**: MusicKit JS v3 is currently in beta and contains preliminary information subject to change
- Token validity is checked up-front and must be valid and not expired to continue with functionality

## Official Documentation Links

- **Main Documentation**: https://js-cdn.music.apple.com/musickit/v3/docs/
- **Getting Started**: https://js-cdn.music.apple.com/musickit/v3/docs/index.html?path=/story/get-started--page
- **JavaScript MusicKit Reference**: https://js-cdn.music.apple.com/musickit/v3/docs/index.html?path=/story/reference-javascript-musickit--page  
- **MusicKit Instance Reference**: https://js-cdn.music.apple.com/musickit/v3/docs/index.html?path=/story/reference-javascript-musickit-instance--page
- **JavaScript API Reference**: https://js-cdn.music.apple.com/musickit/v3/docs/index.html?path=/story/reference-javascript-api--page
- **Events Reference**: https://js-cdn.music.apple.com/musickit/v3/docs/index.html?path=/story/reference-javascript-events--page

## Prerequisites

### Apple Developer Program Requirements
- **Apple Developer Program Membership**: $100/year (required)
- **Team ID**: From Apple Developer Account
- **MusicKit Identifier**: Media identifier created in Certificates, Identifiers & Profiles
- **Private Key**: .p8 file for JWT token generation
- **Key ID**: Associated with the private key

### Environment Setup
```bash
npm install jsonwebtoken  # For server-side JWT generation
```

## Library Integration

### 1. Script Integration (v3) - Official Method
```html
<script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js" data-web-components async></script>
```

**Optional Attributes:**
- `data-web-components`: Loads Web Components for quick playback controls (omit if only making data requests)
- `async`: Recommended - prevents blocking page rendering during script load

### 2. Configuration Options

#### HTML Meta Tag Configuration (Simple Setup)
```html
<head>
  <meta name="apple-music-developer-token" content="DEVELOPER-TOKEN" />
  <meta name="apple-music-app-name" content="Blendify" />
  <meta name="apple-music-app-build" content="1.0.0" />
</head>
```

#### JavaScript Configuration (Advanced Setup)
```javascript
document.addEventListener('musickitloaded', async function () {
  // Call configure() to configure an instance of MusicKit on the Web
  try {
    await MusicKit.configure({
      developerToken: 'DEVELOPER-TOKEN',
      app: {
        name: 'Blendify',
        build: '1.0.0',
      },
    });
  } catch (err) {
    // Handle configuration error
    console.error('MusicKit configuration failed:', err);
  }

  // MusicKit instance is available
  const music = MusicKit.getInstance();
});
```

### 3. The `musickitloaded` Event
**Important**: MusicKit v3 initializes asynchronously. The MusicKit global is not available immediately after the script loads.

```javascript
document.addEventListener('musickitloaded', async function () {
  // MusicKit global is now defined and ready to use
  const music = MusicKit.getInstance();
});
```

**Note**: If using meta tags for configuration, you don't need to call `MusicKit.configure()`, but you still must wait for the `musickitloaded` event.

## Authentication Flow

### 1. JWT Token Generation (Server-side)
```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

function generateDeveloperToken() {
  const privateKey = fs.readFileSync('/path/to/AuthKey_KEYID.p8');
  
  const jwtToken = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d',  // Max 6 months
    issuer: 'TEAM_ID',
    header: {
      kid: 'KEY_ID'
    }
  });
  
  return jwtToken;
}
```

### 2. User Authorization (Official v3 Method)

#### Basic Authorization
```javascript
document.addEventListener('musickitloaded', async function () {
  const music = MusicKit.getInstance();
  
  // User authorization is required before accessing Apple Music data
  await music.authorize();
});
```

#### Authorization with Error Handling
```javascript
document.addEventListener('musickitloaded', async function () {
  const music = MusicKit.getInstance();
  
  try {
    // Required before accessing user's Apple Music data or full playback
    await music.authorize();
    console.log('User authorized successfully');
  } catch (error) {
    console.error('Authorization failed:', error);
    // Handle authorization failure
  }
});
```

#### Conditional Authorization (Recommended Approach)
```javascript
const music = MusicKit.getInstance();

// Music previews can be played without authorization:
await music.play();

// To play the full length of a song, check authorization before calling play():
await music.authorize();
await music.play();

// Check authorization before accessing user's iCloud Music Library:
await music.authorize();
const { data: result } = await music.api.music('v1/me/library/albums');
console.log('User Albums:', result.data);
```

#### Unauthorization
```javascript
const music = MusicKit.getInstance();

// Unauthorize and invalidate the music user token
await music.unauthorize();
```

## Core API Methods (v3)

### Unified API Approach
**Important**: MusicKit v3 uses a single 'passthrough' API method (`music()`) that handles headers and query parameter formatting automatically.

### Accessing User's Library
```javascript
document.addEventListener('musickitloaded', async function () {
  const music = MusicKit.getInstance();
  await music.authorize();
  
  // Get user's library albums
  const { data: albums } = await music.api.music('v1/me/library/albums');
  console.log('User Albums:', albums.data);
  
  // Get user's library songs  
  const { data: songs } = await music.api.music('v1/me/library/songs');
  console.log('User Songs:', songs.data);
  
  // Get user's playlists
  const { data: playlists } = await music.api.music('v1/me/library/playlists');
  console.log('User Playlists:', playlists.data);
  
  // Get user's artists
  const { data: artists } = await music.api.music('v1/me/library/artists');
  console.log('User Artists:', artists.data);
});
```

### Catalog Search
```javascript
const music = MusicKit.getInstance();

// Search catalog (no authorization required)
const { data: searchResults } = await music.api.music('v1/catalog/us/search', {
  term: 'Counting Stars',
  types: 'songs',
  limit: 25
});

// Multi-type search
const { data: multiSearch } = await music.api.music('v1/catalog/us/search', {
  term: 'Coldplay', 
  types: 'songs,artists,albums,playlists',
  limit: 10
});
```

### Playback Control
```javascript
const music = MusicKit.getInstance();

// Basic playback (works with previews without authorization)
await music.play();
await music.pause();
await music.stop();

// Full playback (requires authorization)
await music.authorize();
await music.play(); // Now plays full songs
```

### Queue Management
```javascript
// Set queue with songs
await musicKit.setQueue({
  songs: ['song-id-1', 'song-id-2', 'song-id-3']
});

// Add to queue
await musicKit.queue.append({
  songs: ['additional-song-id']
});

// Get current queue
const currentQueue = musicKit.queue.items;
```

### User Library Access
```javascript
// Get user's playlists
const playlists = await musicKit.api.library.playlists();

// Get user's saved songs
const songs = await musicKit.api.library.songs();

// Get user's albums
const albums = await musicKit.api.library.albums();

// Get user's artists
const artists = await musicKit.api.library.artists();
```

### Playlist Management
```javascript
// Create playlist
const playlist = await musicKit.api.library.playlist({
  attributes: {
    name: 'My Blended Playlist',
    description: 'Created by Blendify'
  },
  relationships: {
    tracks: {
      data: [
        { id: 'song-id-1', type: 'songs' },
        { id: 'song-id-2', type: 'songs' }
      ]
    }
  }
});

// Add tracks to existing playlist
await musicKit.api.library.playlist('playlist-id').tracks.add([
  { id: 'song-id-3', type: 'songs' }
]);
```

## Event Handling

### Player Events
```javascript
// Playback state changes
musicKit.addEventListener('playbackStateDidChange', (event) => {
  console.log('Playback state:', event.state);
  // States: none, loading, playing, paused, stopped, ended, seeking, waiting
});

// Current item changes
musicKit.addEventListener('nowPlayingItemDidChange', (event) => {
  console.log('Now playing:', event.item);
});

// Authorization status changes
musicKit.addEventListener('authorizationStatusDidChange', (event) => {
  console.log('Auth status:', event.authorizationStatus);
  // 0: NotDetermined, 1: Denied, 2: Restricted, 3: Authorized
});

// Queue changes
musicKit.addEventListener('queueItemsDidChange', (event) => {
  console.log('Queue updated:', event.items);
});
```

## Data Collection for Blendify

### User Music Data Sync
```javascript
async function syncAppleMusicData(userId) {
  const musicKit = await setupMusicKit;
  
  // Get user's top songs (recently played approximation)
  const recentSongs = await musicKit.api.library.songs({ limit: 50 });
  
  // Get user's playlists
  const playlists = await musicKit.api.library.playlists({ limit: 100 });
  
  // Get user's saved albums
  const albums = await musicKit.api.library.albums({ limit: 100 });
  
  // Get user's followed artists
  const artists = await musicKit.api.library.artists({ limit: 100 });
  
  // Store data in your database
  await storeAppleMusicData({
    userId,
    songs: recentSongs.data,
    playlists: playlists.data,
    albums: albums.data,
    artists: artists.data
  });
}
```

## Error Handling

```javascript
try {
  await musicKit.authorize();
} catch (error) {
  console.error('Authorization failed:', error);
  
  switch (error.errorCode) {
    case 'AUTHORIZATION_ERROR':
      // Handle authorization failure
      break;
    case 'CONFIGURATION_ERROR':
      // Handle configuration issues
      break;
    case 'NETWORK_ERROR':
      // Handle network issues
      break;
    default:
      // Handle unknown errors
      break;
  }
}
```

## Security Considerations

### JWT Token Security
- **Server-side generation**: Never expose private key to client-side
- **Token expiration**: Maximum 6 months, recommend shorter periods
- **Secure transmission**: Always use HTTPS
- **Token rotation**: Implement regular token refresh

### User Privacy
- **Explicit consent**: Always request user permission before accessing library
- **Data minimization**: Only collect necessary data
- **Secure storage**: Encrypt sensitive user data

## Integration with Blendify Architecture

### 1. Environment Variables
```bash
# .env.local
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=your_private_key_content
APPLE_MUSICKIT_IDENTIFIER=your_musickit_id
```

### 2. Server-side Token Generation
```javascript
// /api/auth/apple-music/token
export async function GET() {
  const token = generateAppleDeveloperToken();
  return Response.json({ token });
}
```

### 3. Client-side Integration
```javascript
// /lib/providers/apple-music.js
export class AppleMusicProvider {
  constructor() {
    this.musicKit = null;
  }
  
  async initialize() {
    const response = await fetch('/api/auth/apple-music/token');
    const { token } = await response.json();
    
    this.musicKit = await window.MusicKit.configure({
      developerToken: token,
      app: {
        name: 'Blendify',
        build: '1.0.0'
      }
    });
  }
  
  async authorize() {
    return await this.musicKit.authorize();
  }
  
  async getUserData() {
    // Implement data collection methods
  }
}
```

## Testing Considerations

### Development Environment
- Use sandbox Apple Music accounts for testing
- Implement mock responses for CI/CD
- Test with various subscription states (trial, active, expired)

### Cross-browser Compatibility
- Test on Safari, Chrome, Firefox, Edge
- Handle browser-specific audio policy restrictions
- Implement fallbacks for unsupported features

## Limitations and Constraints

1. **Apple Music Subscription Required**: Users must have active Apple Music subscription
2. **Browser Restrictions**: Subject to browser audio policy restrictions
3. **Rate Limits**: Apple Music API has usage limits
4. **Geographic Restrictions**: Apple Music availability varies by region
5. **Developer Program Dependency**: Requires active Apple Developer Program membership

## Migration from v1 to v3

### Key Differences
- Updated API endpoints and methods
- Enhanced authentication flow
- Improved error handling
- Better TypeScript support
- New event system

### Breaking Changes
- Some method signatures changed
- Event names updated
- Configuration options modified

## Quick Reference (v3 Essentials)

### Setup Checklist
- [ ] Apple Developer Program membership
- [ ] MusicKit Identifier created
- [ ] Private Key (.p8) generated  
- [ ] Environment variables configured
- [ ] JWT generation service implemented

### Script Tag (Required)
```html
<script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js" data-web-components async></script>
```

### Basic Initialization Pattern
```javascript
document.addEventListener('musickitloaded', async function () {
  await MusicKit.configure({
    developerToken: 'YOUR-DEVELOPER-TOKEN',
    app: { name: 'Blendify', build: '1.0.0' }
  });
  
  const music = MusicKit.getInstance();
  await music.authorize(); // For user data access
  
  // Use the unified API
  const { data } = await music.api.music('v1/me/library/songs');
});
```

### Key Differences from v1
- Single `music()` API method instead of individual endpoints
- Must wait for `musickitloaded` event
- Improved error handling and async support
- Web Components support with `data-web-components` attribute
- Beta status - subject to changes

### Common API Endpoints
- User Library: `'v1/me/library/{albums|songs|artists|playlists}'`
- Catalog Search: `'v1/catalog/us/search'`
- Specific Item: `'v1/catalog/us/songs/{id}'`

This guide provides the foundation for integrating Apple Music functionality into Blendify using MusicKit JS v3.