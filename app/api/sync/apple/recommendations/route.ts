import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, appleRecommendations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { recommendations } = await request.json();
    
    if (!recommendations) {
      return NextResponse.json(
        { error: 'Invalid recommendations data' },
        { status: 400 }
      );
    }

    // Get user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userSessionId));

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Validate recommendations belongs to this user
    if (recommendations.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 403 }
      );
    }

    // Process and save personal recommendations (nested structure)
    const recommendationData = [];
    
    // Process recommended items - Apple Music returns nested structure with relationships.contents.data
    if (recommendations.recommendedItems && recommendations.recommendedItems.length > 0) {
      for (const recommendationGroup of recommendations.recommendedItems) {
        // Each recommendation group has a title and contains actual items in relationships.contents.data
        const groupTitle = recommendationGroup.attributes?.title?.stringForDisplay || 'Recommended';
        const groupType = recommendationGroup.attributes?.kind || 'personal-recommendation';
        
        // Extract the actual content items (playlists, albums, stations)
        const contentItems = recommendationGroup.relationships?.contents?.data || [];
        
        for (const item of contentItems) {
          recommendationData.push({
            userId: user.id,
            appleResourceId: item.id || item.attributes?.playParams?.id || `unknown_${Date.now()}`,
            resourceType: item.type || 'playlist', // Should be 'playlists', 'albums', or 'stations'
            resourceName: item.attributes?.name || 'Unknown Item',
            artistName: item.attributes?.artistName || item.attributes?.curatorName || '',
            albumName: item.type === 'albums' ? item.attributes?.name : '',
            recommendationScore: null, // Not provided by Apple Music recommendations API
            recommendationReason: `${groupTitle} - ${item.attributes?.description?.standard || 'Recommended for you'}`,
            durationMs: item.attributes?.durationInMillis,
            albumArtUrl: item.attributes?.artwork?.url,
            previewUrl: item.attributes?.previews?.[0]?.url,
            isrc: item.attributes?.isrc,
            contentRating: item.attributes?.contentRating,
            genres: item.attributes?.genreNames || [],
            catalogId: item.attributes?.playParams?.catalogId,
            resourceMetadata: {
              groupTitle,
              groupType,
              item
            },
            syncVersion: String(recommendations.syncVersion || Date.now()),
          });
        }
      }
    }
    
    // Save to database
    if (recommendationData.length > 0) {
      // Clear existing recommendation data for this user
      await db.delete(appleRecommendations).where(eq(appleRecommendations.userId, user.id));
      
      // Insert new data
      await db.insert(appleRecommendations).values(recommendationData);
    }
    
    console.log(`APPLE: Personal recommendations data for user ${user.id}:`, {
      recommendationGroups: recommendations.recommendedItems?.length || 0,
      actualItemsProcessed: recommendationData.length,
      totalSaved: recommendationData.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Personal recommendations data saved',
      recommendedCount: recommendationData.length, // Use actual processed items count
      totalSaved: recommendationData.length,
    });

  } catch (error) {
    console.error('Apple Music personal recommendations sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save personal recommendations data' },
      { status: 500 }
    );
  }
}