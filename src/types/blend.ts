// Blend types
export type BlendAlgorithm = 'interleave' | 'weighted' | 'discovery';
export type TimeRange = 'short_term' | 'medium_term' | 'long_term';
export type BlendStatus = 'pending' | 'processing' | 'completed';

export interface BlendFormData {
  name: string;
  friendId: string | null;
  algorithm: BlendAlgorithm;
  trackCount: number;
  timeRange: TimeRange;
}

export interface BlendState extends BlendFormData {
  errors: Record<string, string>;
  loading: boolean;
  currentStep: number;
  totalSteps: number;
}

export type BlendAction =
  | { type: 'UPDATE_FIELD'; field: keyof BlendFormData; value: any }
  | { type: 'SET_ERROR'; field: string; message: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET_FORM' };

export interface BlendContextType extends BlendState {
  updateField: (field: keyof BlendFormData, value: any) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  createBlend: () => Promise<boolean>;
  isValid: boolean;
}

export interface Blend {
  id: string;
  name: string;
  shareCode: string;
  algorithm: BlendAlgorithm;
  trackCount: number;
  timeRange: TimeRange;
  status: BlendStatus;
  createdAt: string;
  updatedAt?: string;
  participants: BlendParticipant[];
  tracks?: BlendTrack[];
}

export interface BlendParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface BlendTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt?: string;
  durationMs: number;
  provider: string;
  position: number;
}