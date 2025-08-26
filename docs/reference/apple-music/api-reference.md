# Apple Music API Reference

## Base URLs and Endpoints
- **Base URL**: `https://api.music.apple.com/v1`
- **Key Endpoints**:
  - `/me/library/playlists` - User's library playlists
  - `/me/library/songs` - User's library songs
  - `/me/recent/played` - Recently played items
  - `/me/recommendations` - Personalized recommendations
  - `/catalog/{storefront}/playlists` - Catalog playlists
  - `/me/library/playlists/{id}` - Specific user playlist
  - `/me/library/playlists/{id}/tracks` - Playlist tracks

## Authentication

### Developer Token (JWT)
Required for all API requests. Must be generated server-side with ES256 algorithm.

**JWT Structure**:
```json
{
  "alg": "ES256",
  "kid": "{KEY_ID}"
}
```

**Payload**:
```json
{
  "iss": "{TEAM_ID}",
  "iat": {ISSUED_AT},
  "exp": {EXPIRES_AT}
}
```
- Maximum expiration: 180 days
- Sign with private key from Apple Developer portal

### Music User Token
Required for user-specific operations:
- Obtained after user authorization through MusicKit JS
- Expires after 6 months (no programmatic renewal)
- Cannot be generated programmatically
- Must be included in `Music-User-Token` header

### Request Headers
```
Authorization: Bearer {DEVELOPER_TOKEN}
Music-User-Token: {USER_TOKEN}
```

## MusicKit JS Setup
```javascript
MusicKit.configure({
  developerToken: '{DEVELOPER_TOKEN}',
  app: {
    name: 'Blendify',
    build: '1.0.0'
  }
});

// Request user authorization
const userToken = await music.authorize();
```

## User Library Operations

### Get User's Playlists
```
GET /me/library/playlists
```

### Create Playlist
```
POST /me/library/playlists
{
  "attributes": {
    "name": "Playlist Name",
    "description": "Description"
  },
  "relationships": {
    "tracks": {
      "data": [
        {"id": "track_id", "type": "songs"}
      ]
    }
  }
}
```

### Add Tracks to Playlist
```
POST /me/library/playlists/{id}/tracks
{
  "data": [
    {"id": "track_id", "type": "songs"}
  ]
}
```

### Get Recently Played
```
GET /me/recent/played
```
Returns user's recently played resources

### Get Recommendations
```
GET /me/recommendations
```
Returns personalized recommendations

## Catalog Operations

### Search Catalog
```
GET /catalog/{storefront}/search?term={query}&types=songs,albums,playlists
```

### Get Song Details
```
GET /catalog/{storefront}/songs/{id}
```

## Rate Limiting
- Specific limits not publicly documented
- Implement exponential backoff on 429 responses
- Use `Retry-After` header when provided
- Cache responses where appropriate

## Error Handling
- 400 Bad Request - Invalid request parameters
- 401 Unauthorized - Invalid/missing developer token
- 403 Forbidden - Invalid/missing user token
- 404 Not Found - Resource not found
- 429 Too Many Requests - Rate limited
- 500 Internal Server Error - Server error

## Required Capabilities
- **MusicKit Identifier**: Create in Apple Developer portal
- **Private Key**: For signing JWT tokens
- **Team ID**: Your Apple Developer Team ID
- **Key ID**: From your MusicKit private key

## Important Notes
- User must have active Apple Music subscription
- User authorization required for library access
- Tokens must be refreshed before expiration
- No direct access to user's top tracks (use recent/recommendations as proxy)
- Playlist modifications require user token
- Cannot programmatically refresh user tokens after 6 months