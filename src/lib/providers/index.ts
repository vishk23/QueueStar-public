import { MusicProvider } from './base';
import { SpotifyProvider } from './spotify';
import { AppleMusicProvider } from './apple';
import { generateAppleDeveloperToken } from '../crypto/jwt';

export * from './base';
export * from './spotify';
export * from './apple';
export * from './errors';

export interface ProviderConfig {
  spotify?: {
    accessToken: string;
  };
  apple?: {
    userToken: string;
    teamId: string;
    keyId: string;
    privateKey: string;
  };
}

export function createSpotifyProvider(accessToken: string): SpotifyProvider {
  return new SpotifyProvider(accessToken);
}

export function createAppleProvider(
  userToken: string,
  teamId: string,
  keyId: string,
  privateKey: string
): AppleMusicProvider {
  const developerToken = generateAppleDeveloperToken(teamId, keyId, privateKey);
  return new AppleMusicProvider(developerToken, userToken);
}

export function createProvider(
  providerType: 'spotify',
  config: { accessToken: string }
): SpotifyProvider;
export function createProvider(
  providerType: 'apple',
  config: { userToken: string; teamId: string; keyId: string; privateKey: string }
): AppleMusicProvider;
export function createProvider(
  providerType: 'spotify' | 'apple',
  config: any
): MusicProvider {
  switch (providerType) {
    case 'spotify':
      return createSpotifyProvider(config.accessToken);
    case 'apple':
      return createAppleProvider(
        config.userToken,
        config.teamId,
        config.keyId,
        config.privateKey
      );
    default:
      throw new Error(`Unsupported provider: ${providerType}`);
  }
}