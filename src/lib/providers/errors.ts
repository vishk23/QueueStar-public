export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: 'spotify' | 'apple',
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class TokenExpiredError extends ProviderError {
  constructor(provider: 'spotify' | 'apple') {
    super(
      `${provider} token expired`,
      provider,
      'TOKEN_EXPIRED',
      provider === 'spotify' // Only Spotify tokens are retryable
    );
  }
}

export class RateLimitError extends ProviderError {
  public retryAfter: number;
  
  constructor(provider: 'spotify' | 'apple', retryAfter: number) {
    super(
      `Rate limited by ${provider}`,
      provider,
      'RATE_LIMIT',
      true
    );
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends ProviderError {
  constructor(provider: 'spotify' | 'apple', message: string = 'Authentication failed') {
    super(message, provider, 'AUTH_ERROR', false);
  }
}

export class NetworkError extends ProviderError {
  constructor(provider: 'spotify' | 'apple', message: string = 'Network request failed') {
    super(message, provider, 'NETWORK_ERROR', true);
  }
}

export class ValidationError extends ProviderError {
  constructor(provider: 'spotify' | 'apple', message: string) {
    super(message, provider, 'VALIDATION_ERROR', false);
  }
}

// Middleware for automatic retry
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof ProviderError && !error.retryable) {
        throw error;
      }
      
      if (error instanceof RateLimitError) {
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        continue;
      }
      
      // Exponential backoff for other errors
      await new Promise(resolve => 
        setTimeout(resolve, Math.min(Math.pow(2, i) * 1000, 10000))
      );
    }
  }
  
  throw lastError;
}