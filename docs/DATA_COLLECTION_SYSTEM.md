# Comprehensive Data Collection System

## Overview

Blendify implements a comprehensive, **append-only** data collection system that captures all available music data from streaming providers when users connect their accounts.

## System Architecture

### Core Principles

1. **🔄 Append-Only Strategy**: Never delete data, always append with timestamps
2. **👤 User-Centric Storage**: All data directly linked to users, not connections
3. **🎵 Complete Coverage**: Collect ALL available data from each provider
4. **💪 Robust Collection**: Individual failures don't break entire sync
5. **📊 Rich Metadata**: Store full API responses for maximum flexibility

### Data Collection Trigger

**Automatic**: When user completes OAuth connection to Spotify/Apple Music
**Manual**: Can be re-triggered for data refresh
**Strategy**: Background sync, user redirected immediately

## Spotify Data Collection

### What We Collect

#### 1. Top Tracks (user_top_tracks)
- **Short-term**: Last 4 weeks, up to 50 tracks
- **Medium-term**: Last 6 months, up to 50 tracks  
- **Long-term**: Last several years, up to 50 tracks
- **Total**: ~150 tracks per user

```typescript
interface TopTrack {
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string;
  durationMs: number;
  isrc: string;
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  rank: number; // 1-50
  trackMetadata: object; // Full Spotify response
  fetchedAt: Date;
}
```

#### 2. Top Artists (user_top_artists)
- **Same time ranges** as tracks
- **Artist details**: name, image, genres, popularity, follower count
- **Total**: ~150 artists per user

#### 3. Recently Played (user_recently_played)
- **Last 50 tracks** played by user
- **Exact timestamps** of when tracks were played
- **Continuously grows** with each sync

#### 4. User Playlists (user_playlists + user_playlist_tracks)
- **All playlists**: owned + followed
- **Complete track lists** for each playlist
- **Metadata**: description, follower count, public/private
- **Volume**: Varies greatly (20-100 playlists, 1000-5000 tracks)

#### 5. Saved Tracks (user_saved_tracks)
- **All liked songs**
- **Save timestamps**
- **Popularity scores**
- **Volume**: 500-2000+ tracks

#### 6. Saved Albums (user_saved_albums)
- **All saved albums**
- **Album metadata**: release date, track count, genres
- **Volume**: 100-500+ albums

#### 7. Followed Artists (user_followed_artists)
- **All followed artists**
- **Artist details**: genres, popularity, follower count
- **Volume**: 50-200+ artists

## Sync Process Flow

### 1. OAuth Callback
```
User completes Spotify OAuth 
    ↓
Callback received with access token
    ↓
User account created/updated
    ↓
Provider connection stored with encrypted tokens
    ↓
🚀 IMMEDIATE DATA SYNC TRIGGERED
    ↓
User redirected to dashboard
```

### 2. Data Collection Sequence
```
1. Top Tracks (3 time ranges)
2. Top Artists (3 time ranges)  
3. Recently Played
4. User Playlists
   └─ For each playlist: Get all tracks
5. Saved Tracks (paginated)
6. Saved Albums (paginated)
7. Followed Artists
```

### 3. Error Handling
- **Individual failures**: Log error, continue with remaining data types
- **API rate limits**: Respect retry-after headers
- **Network errors**: Graceful degradation
- **Partial success**: Still completes OAuth flow

## Technical Implementation

### Sync Function Architecture

```typescript
async function syncSpotifyUserData(provider: SpotifyProvider, userId: string) {
  // 1. Top Tracks (all time ranges)
  await syncTopTracks(provider, userId);
  
  // 2. Top Artists (all time ranges)
  await syncTopArtists(provider, userId);
  
  // 3. Recently Played
  await syncRecentlyPlayed(provider, userId);
  
  // 4. Playlists + Tracks
  await syncUserPlaylists(provider, userId);
  
  // 5. Saved Tracks
  await syncSavedTracks(provider, userId);
  
  // 6. Saved Albums
  await syncSavedAlbums(provider, userId);
  
  // 7. Followed Artists
  await syncFollowedArtists(provider, userId);
}
```

### Pagination Handling

For endpoints with large datasets:

```typescript
async function syncSavedTracks(provider: SpotifyProvider, userId: string) {
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  
  while (hasMore) {
    const data = await provider.getSavedTracks(limit, offset);
    
    if (data.items.length === 0) {
      hasMore = false;
      break;
    }
    
    await db.insert(userSavedTracks).values(/* processed data */);
    
    offset += limit;
    hasMore = data.items.length === limit;
  }
}
```

## Data Storage Strategy

### Append-Only Benefits

1. **Historical tracking**: See how user's taste changes over time
2. **Data integrity**: Never lose information due to bugs
3. **Analytics potential**: Rich historical data for insights
4. **Debugging**: Can trace when data was collected

### Storage Example

```sql
-- User connects Spotify on 2024-01-01
INSERT INTO user_top_tracks (user_id, track_id, track_name, time_range, rank, fetched_at)
VALUES ('user123', 'track456', 'Song A', 'short_term', 1, '2024-01-01 10:00:00');

-- User re-syncs on 2024-02-01 (new top track)
INSERT INTO user_top_tracks (user_id, track_id, track_name, time_range, rank, fetched_at)
VALUES ('user123', 'track789', 'Song B', 'short_term', 1, '2024-02-01 10:00:00');

-- Both records preserved - can see taste change over time
```

### Query Patterns

```sql
-- Get user's LATEST top tracks
SELECT DISTINCT ON (track_id, time_range) *
FROM user_top_tracks
WHERE user_id = 'user123' AND provider = 'spotify'
ORDER BY track_id, time_range, fetched_at DESC;

-- Get user's music history over time
SELECT track_name, time_range, rank, fetched_at
FROM user_top_tracks
WHERE user_id = 'user123' AND track_id = 'track456'
ORDER BY fetched_at ASC;
```

## Apple Music Support

### Planned Implementation

Similar structure with Apple Music API endpoints:

- **Recently Played**: `/v1/me/recent/played`
- **Heavy Rotation**: `/v1/me/history/heavy-rotation` (similar to top tracks)
- **Library**: `/v1/me/library/songs`, `/v1/me/library/albums`
- **Playlists**: `/v1/me/library/playlists`

### Schema Reuse

Same tables, different `provider` enum value:
- `provider = 'spotify'` for Spotify data
- `provider = 'apple'` for Apple Music data

## Monitoring & Observability

### Logging

```typescript
console.log('SPOTIFY: Starting comprehensive data sync for user:', userId);
console.log('SPOTIFY: Fetching short_term tracks');
console.log('SPOTIFY: Retrieved 47 tracks for short_term');
console.log('SPOTIFY: Saved 47 short_term tracks');
// ... continues for all data types
console.log('SPOTIFY: Comprehensive data sync completed for user:', userId);
```

### Metrics to Track

- **Sync duration**: How long full sync takes
- **Data volume**: Number of records collected per user
- **Success rates**: Which data types fail most often
- **API rate limits**: How often we hit limits

## Data Volume Estimates

### Per User Storage

| Data Type | Records | Storage |
|-----------|---------|---------|
| Top Tracks | ~150 | ~50KB |
| Top Artists | ~150 | ~40KB |
| Recently Played | ~50+ | ~20KB+ |
| Playlists | ~20-100 | ~10-50KB |
| Playlist Tracks | ~1000-5000 | ~300KB-1.5MB |
| Saved Tracks | ~500-2000 | ~200KB-800KB |
| Saved Albums | ~100-500 | ~30KB-150KB |
| Followed Artists | ~50-200 | ~15KB-60KB |

**Total per user**: ~3,000-8,000 records, ~2-5MB

### Growth Over Time

- **Initial sync**: Full data collection
- **Re-sync**: Additional records (append-only)
- **Growth rate**: +500-1000 records per re-sync

## Testing Strategy

### Unit Tests
- Mock Spotify provider responses
- Test individual sync functions
- Verify append-only behavior
- Test error handling

### Integration Tests
- Full sync with real test Spotify account
- Database integrity checks
- Performance testing with large datasets

### Manual Testing
- Connect real Spotify account
- Verify all data types collected
- Check data quality and completeness

## Future Enhancements

### Incremental Sync
- Track last sync timestamp
- Only fetch new/changed data
- Reduce API calls and processing time

### Real-time Updates
- Webhook support from Spotify
- Live recently played updates
- Push notifications for new saves/follows

### Data Analysis
- Music taste evolution tracking
- Cross-user similarity analysis
- Recommendation engine based on collected data

### Additional Providers
- YouTube Music
- SoundCloud
- Bandcamp
- Last.fm

## Configuration

### Environment Variables

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/blendify_dev
```

### API Rate Limits

- **Spotify**: 100 requests per minute per user
- **Strategy**: Respect rate limits, use exponential backoff
- **Batch processing**: Minimize API calls where possible

## Troubleshooting

### Common Issues

1. **Token expiration**: Handled automatically with refresh tokens
2. **Rate limiting**: Exponential backoff implemented
3. **Partial failures**: Individual data type failures logged, don't break flow
4. **Large playlists**: Pagination handles unlimited playlist sizes

### Debug Logging

Enable verbose logging to troubleshoot sync issues:

```typescript
console.log('SPOTIFY: Debug info', { userId, dataType, recordCount, error });
```

This comprehensive system ensures we capture the complete picture of each user's music taste, providing rich data for building sophisticated blending algorithms.