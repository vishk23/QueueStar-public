# Spotify Web API Reference

## Base URLs and Endpoints
- **Base URL**: `https://api.spotify.com/v1`
- **Key Endpoints**:
  - `/me` - Current user profile
  - `/users/{user_id}` - User profile
  - `/playlists/{playlist_id}` - Get/modify playlist
  - `/playlists/{playlist_id}/tracks` - Manage playlist tracks
  - `/me/playlists` - Get current user's playlists
  - `/users/{user_id}/playlists` - Create playlist for user
  - `/me/top/{type}` - Get user's top artists/tracks

## Authentication
### Authorization Code with PKCE Flow
1. Generate code verifier and challenge
2. Direct user to authorize endpoint:
   ```
   https://accounts.spotify.com/authorize?
     client_id={CLIENT_ID}
     &response_type=code
     &redirect_uri={REDIRECT_URI}
     &code_challenge_method=S256
     &code_challenge={CODE_CHALLENGE}
     &scope={SCOPES}
   ```
3. Exchange authorization code for tokens:
   ```
   POST https://accounts.spotify.com/api/token
   {
     grant_type: 'authorization_code',
     code: {AUTH_CODE},
     redirect_uri: {REDIRECT_URI},
     client_id: {CLIENT_ID},
     code_verifier: {CODE_VERIFIER}
   }
   ```
4. Refresh tokens when expired:
   ```
   POST https://accounts.spotify.com/api/token
   {
     grant_type: 'refresh_token',
     refresh_token: {REFRESH_TOKEN},
     client_id: {CLIENT_ID}
   }
   ```

## Required Scopes
- **user-read-private** - Access user subscription details
- **user-read-email** - Get user email
- **user-top-read** - Access user's top artists and tracks
- **playlist-read-private** - Access user's private playlists
- **playlist-read-collaborative** - Access collaborative playlists
- **playlist-modify-public** - Create/modify public playlists
- **playlist-modify-private** - Create/modify private playlists

## Rate Limiting
- HTTP 429 Too Many Requests when rate limit exceeded
- Retry-After header indicates wait time
- Implement exponential backoff strategy
- Consider caching frequently accessed data

## Playlist Operations

### Get User's Top Tracks
```
GET /me/top/tracks?time_range={time_range}&limit={limit}
```
- time_range: short_term, medium_term, long_term
- limit: 1-50 (default 20)

### Create Playlist
```
POST /users/{user_id}/playlists
{
  "name": "Playlist Name",
  "description": "Description",
  "public": false
}
```

### Add Tracks to Playlist
```
POST /playlists/{playlist_id}/tracks
{
  "uris": ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
  "position": 0
}
```

### Get Playlist
```
GET /playlists/{playlist_id}
```

## User Profile Operations

### Get Current User Profile
```
GET /me
```
Returns: id, display_name, email, images, product, etc.

### Get User Profile
```
GET /users/{user_id}
```
Returns: id, display_name, images, followers

## Error Handling
- 400 Bad Request - Invalid request
- 401 Unauthorized - Invalid/expired token
- 403 Forbidden - Insufficient scope
- 404 Not Found - Resource not found
- 429 Too Many Requests - Rate limited
- 500 Internal Server Error - Server error

## Token Expiration
- Access tokens expire in 1 hour
- Use refresh token to obtain new access token
- Refresh tokens don't expire but can be revoked