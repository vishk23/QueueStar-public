import { Track } from '../providers/base';

export interface BlendInput {
  userId: string;
  tracks: Track[];
  weight?: number; // Optional weighting for this user's contribution
}

export interface BlendedTrack extends Track {
  contributedBy: string;
  originalRank: number;
}

export interface BlendOptions {
  maxTracks: number;
  algorithm: 'interleave' | 'weighted' | 'discovery';
  removeDuplicates: boolean;
  diversityBoost: boolean;
}

export class BlendAlgorithm {
  /**
   * Simple interleaving algorithm - alternates tracks between users
   */
  static interleave(inputs: BlendInput[], options: BlendOptions): BlendedTrack[] {
    const { maxTracks, removeDuplicates } = options;
    const result: BlendedTrack[] = [];
    const trackMap = new Set<string>(); // For duplicate detection
    
    // Find the maximum number of tracks from any user
    const maxUserTracks = Math.max(...inputs.map(input => input.tracks.length));
    
    for (let i = 0; i < maxUserTracks && result.length < maxTracks; i++) {
      for (const input of inputs) {
        if (result.length >= maxTracks) break;
        
        const track = input.tracks[i];
        if (!track) continue;
        
        // Check for duplicates by ISRC first, then by track name + artist
        const trackKey = track.isrc || `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
        
        if (removeDuplicates && trackMap.has(trackKey)) {
          continue;
        }
        
        trackMap.add(trackKey);
        result.push({
          ...track,
          contributedBy: input.userId,
          originalRank: i + 1,
        });
      }
    }
    
    return result;
  }
  
  /**
   * Weighted algorithm - uses user weights to determine contribution ratio
   */
  static weighted(inputs: BlendInput[], options: BlendOptions): BlendedTrack[] {
    const { maxTracks, removeDuplicates } = options;
    const result: BlendedTrack[] = [];
    const trackMap = new Set<string>();
    
    // Calculate weights (default to equal if not specified)
    const totalWeight = inputs.reduce((sum, input) => sum + (input.weight || 1), 0);
    const normalizedInputs = inputs.map(input => ({
      ...input,
      normalizedWeight: (input.weight || 1) / totalWeight,
      targetCount: Math.floor(maxTracks * ((input.weight || 1) / totalWeight)),
      currentCount: 0,
    }));
    
    // Fill tracks based on weights
    let totalAdded = 0;
    while (totalAdded < maxTracks) {
      let addedInRound = false;
      
      for (const input of normalizedInputs) {
        if (totalAdded >= maxTracks) break;
        if (input.currentCount >= input.targetCount) continue;
        if (input.currentCount >= input.tracks.length) continue;
        
        const track = input.tracks[input.currentCount];
        const trackKey = track.isrc || `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
        
        if (removeDuplicates && trackMap.has(trackKey)) {
          input.currentCount++;
          continue;
        }
        
        trackMap.add(trackKey);
        result.push({
          ...track,
          contributedBy: input.userId,
          originalRank: input.currentCount + 1,
        });
        
        input.currentCount++;
        totalAdded++;
        addedInRound = true;
      }
      
      // If no tracks were added in this round, break to avoid infinite loop
      if (!addedInRound) break;
    }
    
    return result;
  }
  
  /**
   * Discovery algorithm - promotes less popular tracks and ensures diversity
   */
  static discovery(inputs: BlendInput[], options: BlendOptions): BlendedTrack[] {
    const { maxTracks, removeDuplicates, diversityBoost } = options;
    
    // First, get all tracks with discovery scores
    const allTracks: (BlendedTrack & { discoveryScore: number })[] = [];
    
    inputs.forEach(input => {
      input.tracks.forEach((track, index) => {
        // Discovery score based on:
        // - Higher index (later in list) = more discoverable
        // - Different artists get bonus points
        const rankScore = (index + 1) / input.tracks.length; // Higher for later tracks
        const diversityScore = diversityBoost ? this.getDiversityScore(track, allTracks) : 0;
        
        allTracks.push({
          ...track,
          contributedBy: input.userId,
          originalRank: index + 1,
          discoveryScore: rankScore + diversityScore,
        });
      });
    });
    
    // Sort by discovery score (higher = more discoverable)
    allTracks.sort((a, b) => b.discoveryScore - a.discoveryScore);
    
    // Apply duplicate removal if needed
    const result: BlendedTrack[] = [];
    const trackMap = new Set<string>();
    
    for (const track of allTracks) {
      if (result.length >= maxTracks) break;
      
      const trackKey = track.isrc || `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
      
      if (removeDuplicates && trackMap.has(trackKey)) {
        continue;
      }
      
      trackMap.add(trackKey);
      result.push(track);
    }
    
    return result;
  }
  
  private static getDiversityScore(
    track: Track,
    existingTracks: (BlendedTrack & { discoveryScore: number })[]
  ): number {
    const artistCount = existingTracks.filter(t => 
      t.artist.toLowerCase() === track.artist.toLowerCase()
    ).length;
    
    // Return bonus points for artists not yet in the mix
    return artistCount === 0 ? 0.3 : Math.max(0, 0.3 - (artistCount * 0.1));
  }
  
  /**
   * Main blend function - dispatches to appropriate algorithm
   */
  static blend(inputs: BlendInput[], options: BlendOptions): BlendedTrack[] {
    if (inputs.length === 0) return [];
    
    switch (options.algorithm) {
      case 'interleave':
        return this.interleave(inputs, options);
      case 'weighted':
        return this.weighted(inputs, options);
      case 'discovery':
        return this.discovery(inputs, options);
      default:
        return this.interleave(inputs, options);
    }
  }
}