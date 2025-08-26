import { describe, it, expect } from 'vitest';
import { BlendAlgorithm, BlendInput, BlendOptions } from '@/lib/utils/blend-algorithm';
import { Track } from '@/lib/providers/base';

const createMockTrack = (id: string, name: string, artist: string): Track => ({
  id,
  name,
  artist,
  album: 'Test Album',
  albumArt: 'https://example.com/art.jpg',
  durationMs: 180000,
  provider: 'spotify',
});

const createMockTracks = (prefix: string, count: number): Track[] => 
  Array.from({ length: count }, (_, i) => 
    createMockTrack(`${prefix}${i + 1}`, `Track ${i + 1}`, `Artist ${prefix}${i + 1}`)
  );

const defaultOptions: BlendOptions = {
  maxTracks: 10,
  algorithm: 'interleave',
  removeDuplicates: true,
  diversityBoost: false,
};

describe('BlendAlgorithm', () => {
  describe('interleave', () => {
    it('should interleave tracks from two users equally', () => {
      const user1Tracks = createMockTracks('A', 5);
      const user2Tracks = createMockTracks('B', 5);
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: user1Tracks },
        { userId: 'user2', tracks: user2Tracks },
      ];
      
      const result = BlendAlgorithm.interleave(inputs, defaultOptions);
      
      expect(result).toHaveLength(10);
      
      // Check alternating pattern
      expect(result[0].contributedBy).toBe('user1');
      expect(result[1].contributedBy).toBe('user2');
      expect(result[2].contributedBy).toBe('user1');
      expect(result[3].contributedBy).toBe('user2');
      
      // Check track IDs
      expect(result[0].id).toBe('A1');
      expect(result[1].id).toBe('B1');
      expect(result[2].id).toBe('A2');
      expect(result[3].id).toBe('B2');
    });

    it('should handle uneven track counts', () => {
      const user1Tracks = createMockTracks('A', 3);
      const user2Tracks = createMockTracks('B', 1);
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: user1Tracks },
        { userId: 'user2', tracks: user2Tracks },
      ];
      
      const result = BlendAlgorithm.interleave(inputs, defaultOptions);
      
      expect(result).toHaveLength(4);
      expect(result[0].contributedBy).toBe('user1');
      expect(result[1].contributedBy).toBe('user2');
      expect(result[2].contributedBy).toBe('user1');
      expect(result[3].contributedBy).toBe('user1');
    });

    it('should respect maxTracks limit', () => {
      const user1Tracks = createMockTracks('A', 10);
      const user2Tracks = createMockTracks('B', 10);
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: user1Tracks },
        { userId: 'user2', tracks: user2Tracks },
      ];
      
      const options = { ...defaultOptions, maxTracks: 5 };
      const result = BlendAlgorithm.interleave(inputs, options);
      
      expect(result).toHaveLength(5);
    });

    it('should remove duplicates when enabled', () => {
      const duplicateTrack = createMockTrack('SAME', 'Same Song', 'Same Artist');
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: [duplicateTrack, createMockTrack('A2', 'Track A2', 'Artist A')] },
        { userId: 'user2', tracks: [duplicateTrack, createMockTrack('B2', 'Track B2', 'Artist B')] },
      ];
      
      const result = BlendAlgorithm.interleave(inputs, defaultOptions);
      
      expect(result).toHaveLength(3); // One duplicate removed
      expect(result.filter(t => t.name === 'Same Song')).toHaveLength(1);
    });

    it('should preserve duplicates when disabled', () => {
      const duplicateTrack = createMockTrack('SAME', 'Same Song', 'Same Artist');
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: [duplicateTrack] },
        { userId: 'user2', tracks: [duplicateTrack] },
      ];
      
      const options = { ...defaultOptions, removeDuplicates: false };
      const result = BlendAlgorithm.interleave(inputs, options);
      
      expect(result).toHaveLength(2);
      expect(result.filter(t => t.name === 'Same Song')).toHaveLength(2);
    });

    it('should handle empty inputs', () => {
      const result = BlendAlgorithm.interleave([], defaultOptions);
      expect(result).toHaveLength(0);
    });

    it('should handle single user', () => {
      const tracks = createMockTracks('A', 3);
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks },
      ];
      
      const result = BlendAlgorithm.interleave(inputs, defaultOptions);
      
      expect(result).toHaveLength(3);
      expect(result.every(t => t.contributedBy === 'user1')).toBe(true);
    });
  });

  describe('weighted', () => {
    it('should respect user weights', () => {
      const user1Tracks = createMockTracks('A', 10);
      const user2Tracks = createMockTracks('B', 10);
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: user1Tracks, weight: 3 }, // 75%
        { userId: 'user2', tracks: user2Tracks, weight: 1 }, // 25%
      ];
      
      const options = { ...defaultOptions, algorithm: 'weighted' as const, maxTracks: 8 };
      const result = BlendAlgorithm.weighted(inputs, options);
      
      const user1Count = result.filter(t => t.contributedBy === 'user1').length;
      const user2Count = result.filter(t => t.contributedBy === 'user2').length;
      
      expect(user1Count).toBeGreaterThan(user2Count);
      expect(user1Count).toBe(6); // 75% of 8
      expect(user2Count).toBe(2); // 25% of 8
    });

    it('should default to equal weights', () => {
      const user1Tracks = createMockTracks('A', 5);
      const user2Tracks = createMockTracks('B', 5);
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: user1Tracks }, // No weight specified
        { userId: 'user2', tracks: user2Tracks }, // No weight specified
      ];
      
      const options = { ...defaultOptions, algorithm: 'weighted' as const, maxTracks: 6 };
      const result = BlendAlgorithm.weighted(inputs, options);
      
      const user1Count = result.filter(t => t.contributedBy === 'user1').length;
      const user2Count = result.filter(t => t.contributedBy === 'user2').length;
      
      expect(user1Count).toBe(3);
      expect(user2Count).toBe(3);
    });
  });

  describe('discovery', () => {
    it('should promote tracks from the end of lists', () => {
      const user1Tracks = createMockTracks('A', 5);
      const user2Tracks = createMockTracks('B', 5);
      
      const inputs: BlendInput[] = [
        { userId: 'user1', tracks: user1Tracks },
        { userId: 'user2', tracks: user2Tracks },
      ];
      
      const options = { ...defaultOptions, algorithm: 'discovery' as const };
      const result = BlendAlgorithm.discovery(inputs, options);
      
      expect(result).toHaveLength(10);
      
      // Later tracks should appear earlier in discovery mode
      const trackA5Position = result.findIndex(t => t.id === 'A5');
      const trackA1Position = result.findIndex(t => t.id === 'A1');
      
      expect(trackA5Position).toBeLessThan(trackA1Position);
    });
  });

  describe('blend', () => {
    it('should dispatch to correct algorithm', () => {
      const tracks = createMockTracks('A', 3);
      const inputs: BlendInput[] = [{ userId: 'user1', tracks }];
      
      const interleaveResult = BlendAlgorithm.blend(inputs, {
        ...defaultOptions,
        algorithm: 'interleave',
      });
      
      const weightedResult = BlendAlgorithm.blend(inputs, {
        ...defaultOptions,
        algorithm: 'weighted',
      });
      
      expect(interleaveResult).toHaveLength(3);
      expect(weightedResult).toHaveLength(3);
    });

    it('should handle empty inputs gracefully', () => {
      const result = BlendAlgorithm.blend([], defaultOptions);
      expect(result).toHaveLength(0);
    });

    it('should add originalRank to tracks', () => {
      const tracks = createMockTracks('A', 3);
      const inputs: BlendInput[] = [{ userId: 'user1', tracks }];
      
      const result = BlendAlgorithm.blend(inputs, defaultOptions);
      
      expect(result[0].originalRank).toBe(1);
      expect(result[1].originalRank).toBe(2);
      expect(result[2].originalRank).toBe(3);
    });
  });
});