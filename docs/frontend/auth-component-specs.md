# Authentication Component Specifications

## Overview

The authentication system consists of several key components that handle user login, OAuth callbacks, session management, and route protection. Each component has specific responsibilities and interfaces.

## Component Hierarchy

```
Authentication System
├── Pages
│   ├── LoginPage
│   └── CallbackPage (Spotify/Apple)
├── Forms
│   ├── LoginForm
│   └── ProviderButton
├── Guards
│   ├── AuthGuard
│   └── GuestGuard
├── Features
│   ├── OAuthCallback
│   └── SessionChecker
└── UI Components
    ├── ProviderIcon
    └── AuthStatus
```

## Page Components

### LoginPage
**File**: `app/(auth)/login/page.tsx`

#### Purpose
Landing page for authentication with provider selection and marketing content.

#### Requirements
- **Hero Section**: Welcome message and value proposition
- **Provider Buttons**: Spotify and Apple Music login options
- **Loading States**: Show loading during OAuth initiation
- **Error Handling**: Display OAuth errors from URL params
- **Responsive Design**: Mobile-first responsive layout
- **SEO**: Proper meta tags and structured data

#### Props Interface
```typescript
// Server component - no props, but uses searchParams
interface LoginPageSearchParams {
  error?: string;
  message?: string;
}
```

#### Component Structure
```typescript
export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginPageSearchParams;
}) {
  // Check if already authenticated (redirect to dashboard)
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse">
        {/* Hero content */}
        <div className="text-center lg:text-left max-w-md">
          <h1 className="text-5xl font-bold">Welcome to Blendify!</h1>
          <p className="py-6">
            Connect your music accounts and create amazing blended playlists with friends.
            Discover new music through collaborative mixing.
          </p>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Active Users</div>
              <div className="stat-value">1.2K</div>
            </div>
            <div className="stat">
              <div className="stat-title">Blends Created</div>
              <div className="stat-value">5.6K</div>
            </div>
          </div>
        </div>
        
        {/* Login form */}
        <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body">
            <LoginForm error={searchParams.error} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### States
- **Default**: Show login form and hero content
- **Error**: Display error message from OAuth failure
- **Success**: Show success message (rare, usually redirects)

#### Testing Requirements
- Renders hero content and login form
- Shows error messages from URL params
- Redirects authenticated users to dashboard
- Responsive layout works on mobile/desktop

---

### CallbackPage
**File**: `app/(auth)/callback/[provider]/page.tsx`

#### Purpose
Handle OAuth callbacks from Spotify/Apple Music and redirect to dashboard.

#### Requirements
- **Provider Validation**: Ensure provider param is valid
- **Loading State**: Show loading while processing callback
- **Error Handling**: Handle OAuth errors gracefully
- **Redirect Logic**: Redirect to dashboard on success, login on error
- **Session Creation**: Ensure user session is established

#### Props Interface
```typescript
interface CallbackPageProps {
  params: {
    provider: 'spotify' | 'apple';
  };
  searchParams: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };
}
```

#### Component Structure
```typescript
export default async function CallbackPage({ 
  params, 
  searchParams 
}: CallbackPageProps) {
  // Validate provider
  if (!['spotify', 'apple'].includes(params.provider)) {
    notFound();
  }

  // Handle OAuth error
  if (searchParams.error) {
    const errorMessage = searchParams.error_description || 'Authentication failed';
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  // The actual OAuth processing is handled by the API route
  // This page just shows loading state while processing
  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <div className="loading loading-spinner loading-lg"></div>
          <h1 className="text-2xl font-bold mt-4">
            Completing sign in...
          </h1>
          <p className="py-4">
            Please wait while we connect your {params.provider} account.
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### Client-side Handler (if needed)
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const CallbackHandler = ({ provider }: { provider: string }) => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Refresh user data after OAuth
      await refreshUser();
      router.push('/dashboard');
    };

    // Small delay to ensure API processing is complete
    const timer = setTimeout(handleCallback, 2000);
    return () => clearTimeout(timer);
  }, [refreshUser, router]);

  return null;
};
```

## Form Components

### LoginForm
**File**: `components/forms/LoginForm/LoginForm.tsx`

#### Purpose
Form component with provider selection buttons and error display.

#### Requirements
- **Provider Buttons**: Spotify and Apple Music options
- **Loading States**: Individual button loading states
- **Error Display**: Show authentication errors
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Analytics**: Track login attempts by provider

#### Props Interface
```typescript
interface LoginFormProps {
  error?: string;
  onSuccess?: () => void;
  className?: string;
}
```

#### Component Structure
```typescript
'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ProviderButton } from './ProviderButton';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';

export const LoginForm: React.FC<LoginFormProps> = ({ 
  error, 
  onSuccess,
  className = '' 
}) => {
  const { login, loading } = useAuth();
  const { showToast } = useUI();

  const handleProviderLogin = async (provider: 'spotify' | 'apple') => {
    try {
      await login(provider);
      onSuccess?.();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Login Failed',
        message: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Connect Your Music</h2>
        <p className="text-sm opacity-70 mt-1">
          Choose your preferred streaming service
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <ProviderButton
          provider="spotify"
          onClick={() => handleProviderLogin('spotify')}
          loading={loading}
          disabled={loading}
        />
        
        <ProviderButton
          provider="apple"
          onClick={() => handleProviderLogin('apple')}
          loading={loading}
          disabled={loading}
        />
      </div>

      <div className="text-xs text-center opacity-60">
        By continuing, you agree to our Terms of Service and Privacy Policy.
        We'll never post to your account or access your personal information.
      </div>
    </div>
  );
};
```

#### States
- **Default**: Show both provider buttons enabled
- **Loading**: Show loading state on clicked button, disable others
- **Error**: Display error message above buttons
- **Success**: Brief success state before redirect (handled by context)

---

### ProviderButton
**File**: `components/forms/LoginForm/ProviderButton.tsx`

#### Purpose
Individual provider authentication button with icon and branding.

#### Requirements
- **Provider Icons**: Spotify and Apple Music logos
- **Consistent Styling**: Match each provider's brand colors
- **Loading States**: Show spinner when processing
- **Hover Effects**: Visual feedback on interaction
- **Accessibility**: Screen reader friendly

#### Props Interface
```typescript
interface ProviderButtonProps {
  provider: 'spotify' | 'apple';
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Component Structure
```typescript
import React from 'react';
import { Button } from '@/components/ui/Button';
import { SpotifyIcon, AppleMusicIcon } from '@/components/ui/Icons';

export const ProviderButton: React.FC<ProviderButtonProps> = ({
  provider,
  onClick,
  loading = false,
  disabled = false,
  size = 'lg',
  className = '',
}) => {
  const providerConfig = {
    spotify: {
      name: 'Spotify',
      icon: SpotifyIcon,
      colors: 'hover:bg-[#1db954] hover:text-white hover:border-[#1db954]',
    },
    apple: {
      name: 'Apple Music',
      icon: AppleMusicIcon,
      colors: 'hover:bg-[#fa243c] hover:text-white hover:border-[#fa243c]',
    },
  };

  const config = providerConfig[provider];
  const IconComponent = config.icon;

  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={`w-full justify-start gap-3 transition-colors ${config.colors} ${className}`}
    >
      {!loading && <IconComponent className="w-5 h-5" />}
      Continue with {config.name}
    </Button>
  );
};
```

## Guard Components

### AuthGuard
**File**: `components/layout/AuthGuard/AuthGuard.tsx`

#### Purpose
Protect routes that require authentication, redirect to login if not authenticated.

#### Requirements
- **Authentication Check**: Verify user is logged in
- **Loading State**: Show loading while checking auth
- **Redirect Logic**: Send to login page if not authenticated
- **Return URL**: Remember where user wanted to go
- **Error Handling**: Handle auth check failures

#### Props Interface
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  requireProvider?: 'spotify' | 'apple' | 'any';
}
```

#### Component Structure
```typescript
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProviders } from '@/contexts/ProvidersContext';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login',
  fallback,
  requireProvider,
}) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { connections, loading: providersLoading } = useProviders();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Save return URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, authLoading, router, redirectTo, pathname]);

  // Still loading auth state
  if (authLoading || providersLoading) {
    return fallback || (
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Redirect will happen in useEffect
  }

  // Check provider requirement
  if (requireProvider && requireProvider !== 'any') {
    const hasRequiredProvider = connections.some(
      conn => conn.provider === requireProvider
    );
    
    if (!hasRequiredProvider) {
      return (
        <div className="hero min-h-96">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-2xl font-bold">Provider Required</h1>
              <p className="py-4">
                This feature requires a {requireProvider} connection.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.href = `/api/auth/${requireProvider}`}
              >
                Connect {requireProvider}
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
```

### GuestGuard
**File**: `components/layout/GuestGuard/GuestGuard.tsx`

#### Purpose
Redirect authenticated users away from auth pages (login, signup).

#### Requirements
- **Authentication Check**: Verify user is NOT logged in
- **Redirect Logic**: Send authenticated users to dashboard
- **Loading State**: Show loading while checking auth

#### Props Interface
```typescript
interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}
```

#### Component Structure
```typescript
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export const GuestGuard: React.FC<GuestGuardProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  // Still loading
  if (loading) {
    return null; // Or a minimal loading state
  }

  // Authenticated user - redirect happening
  if (isAuthenticated) {
    return null;
  }

  // Guest user - show content
  return <>{children}</>;
};
```

## Feature Components

### OAuthCallback
**File**: `components/features/auth/OAuthCallback/OAuthCallback.tsx`

#### Purpose
Handle OAuth callback processing on the client side.

#### Requirements
- **URL Parameter Processing**: Extract code, state, error from URL
- **API Integration**: Call backend callback endpoint
- **Error Handling**: Display OAuth errors
- **Loading States**: Show processing state
- **Redirect Logic**: Navigate after successful auth

#### Props Interface
```typescript
interface OAuthCallbackProps {
  provider: 'spotify' | 'apple';
}
```

#### Component Structure
```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ provider }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for OAuth error
        const oauthError = searchParams.get('error');
        if (oauthError) {
          const errorDescription = searchParams.get('error_description') || 'Authentication failed';
          throw new Error(errorDescription);
        }

        // Wait a moment for the API route to process
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Refresh user data to confirm authentication
        await refreshUser();
        
        setStatus('success');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to login with error
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`);
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, refreshUser, router]);

  if (status === 'loading') {
    return (
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <LoadingSpinner size="lg" />
            <h1 className="text-2xl font-bold mt-4">
              Completing sign in...
            </h1>
            <p className="py-4">
              Please wait while we connect your {provider} account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-error">
              Authentication Failed
            </h1>
            <p className="py-4">{error}</p>
            <p className="text-sm opacity-70">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-success">
            Successfully Connected!
          </h1>
          <p className="py-4">
            Your {provider} account has been connected.
          </p>
          <p className="text-sm opacity-70">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};
```

## Testing Specifications

### Unit Tests Required
Each component must have tests covering:

1. **Rendering Tests**
   - Renders with default props
   - Renders with various prop combinations
   - Handles missing props gracefully

2. **Interaction Tests**
   - Button clicks trigger correct actions
   - Form submissions work correctly
   - Loading states prevent multiple submissions

3. **State Tests**
   - Loading states display correctly
   - Error states show appropriate messages
   - Success states redirect properly

4. **Integration Tests**
   - Context integration works
   - Router integration works
   - API integration works (mocked)

### Example Test Structure
```typescript
// LoginForm.test.tsx
describe('LoginForm', () => {
  it('renders provider buttons', () => {
    render(<LoginForm />);
    expect(screen.getByText('Continue with Spotify')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple Music')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<LoginForm error="Invalid credentials" />);
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('handles provider login', async () => {
    const mockLogin = jest.fn();
    render(<LoginForm />);
    
    await user.click(screen.getByText('Continue with Spotify'));
    expect(mockLogin).toHaveBeenCalledWith('spotify');
  });
});
```

This specification provides a complete blueprint for implementing the authentication components with proper error handling, loading states, and user experience patterns.