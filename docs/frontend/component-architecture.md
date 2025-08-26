# Frontend Component Architecture

## Atomic Design System

We'll follow Atomic Design principles with a practical folder structure:

```
components/
├── ui/                    # Atoms - Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   ├── Modal/
│   ├── Avatar/
│   ├── LoadingSpinner/
│   └── Toast/
├── forms/                 # Molecules - Form-specific compounds
│   ├── LoginForm/
│   ├── BlendForm/
│   ├── UserProfileForm/
│   └── SearchInput/
├── features/              # Organisms - Feature-specific components
│   ├── auth/
│   ├── dashboard/
│   ├── blend/
│   └── providers/
├── layout/                # Layout components
│   ├── RootLayout/
│   ├── Navbar/
│   ├── Sidebar/
│   └── AuthGuard/
└── pages/                 # Page-level components (if needed)
    ├── LoginPage/
    ├── DashboardPage/
    └── BlendPage/
```

## UI Components (Atoms)

### Component Structure Pattern

Each UI component follows this structure:

```typescript
// components/ui/Button/Button.tsx
import React from 'react';
import { ButtonProps } from './Button.types';
import { getButtonClasses } from './Button.utils';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const buttonClasses = getButtonClasses({ variant, size, loading, className });

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        children
      )}
    </button>
  );
};

// components/ui/Button/Button.types.ts
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

// components/ui/Button/Button.utils.ts
import { ButtonProps } from './Button.types';

export const getButtonClasses = ({ 
  variant, 
  size, 
  loading, 
  className 
}: Pick<ButtonProps, 'variant' | 'size' | 'loading' | 'className'>) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const loadingClasses = loading ? 'loading' : '';
  
  return [baseClasses, variantClasses, sizeClasses, loadingClasses, className]
    .filter(Boolean)
    .join(' ');
};

// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';

// components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('loading');
  });
});
```

### UI Component Inventory

#### Button Component
```typescript
// Primary usage across the app
<Button variant="primary" size="lg" onClick={handleLogin}>
  Login with Spotify
</Button>

<Button variant="outline" size="sm" loading={isLoading}>
  Sync Tracks
</Button>
```

#### Input Component
```typescript
// Form inputs with consistent styling
<Input
  label="Blend Name"
  placeholder="Enter blend name"
  value={name}
  onChange={setName}
  error={errors.name}
  helperText="Choose something memorable"
/>
```

#### Card Component
```typescript
// Content containers
<Card className="hover:shadow-lg transition-shadow">
  <Card.Header>
    <Card.Title>Spotify Connection</Card.Title>
  </Card.Header>
  <Card.Body>
    <p>Connected as John Doe</p>
  </Card.Body>
  <Card.Actions>
    <Button variant="outline">Disconnect</Button>
    <Button variant="primary">Sync</Button>
  </Card.Actions>
</Card>
```

#### Modal Component
```typescript
// Dialogs and overlays
<Modal isOpen={showModal} onClose={closeModal}>
  <Modal.Header title="Create New Blend" />
  <Modal.Body>
    <BlendForm />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="ghost" onClick={closeModal}>Cancel</Button>
    <Button variant="primary" onClick={createBlend}>Create</Button>
  </Modal.Footer>
</Modal>
```

## Form Components (Molecules)

### LoginForm Component
```typescript
// components/forms/LoginForm/LoginForm.tsx
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { SpotifyIcon, AppleMusicIcon } from '@/components/ui/Icons';

export const LoginForm: React.FC = () => {
  const { login, loading, error } = useAuth();

  const handleProviderLogin = (provider: 'spotify' | 'apple') => {
    login(provider);
  };

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title className="text-center">
          Connect Your Music Account
        </Card.Title>
        <Card.Description className="text-center">
          Choose your preferred music streaming service
        </Card.Description>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3"
          onClick={() => handleProviderLogin('spotify')}
          disabled={loading}
        >
          <SpotifyIcon className="w-5 h-5" />
          Continue with Spotify
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3"
          onClick={() => handleProviderLogin('apple')}
          disabled={loading}
        >
          <AppleMusicIcon className="w-5 h-5" />
          Continue with Apple Music
        </Button>
      </Card.Body>
      
      <Card.Footer className="text-center text-sm opacity-70">
        We'll never post to your account or access your personal information
      </Card.Footer>
    </Card>
  );
};
```

### BlendForm Component
```typescript
// components/forms/BlendForm/BlendForm.tsx
import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { useBlend } from '@/contexts/BlendContext';

export const BlendForm: React.FC = () => {
  const {
    name,
    algorithm,
    trackCount,
    timeRange,
    errors,
    updateField,
    currentStep,
    totalSteps,
  } = useBlend();

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="steps steps-horizontal w-full">
        <div className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>
          Details
        </div>
        <div className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>
          Friend
        </div>
        <div className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>
          Settings
        </div>
      </div>

      {/* Step 1: Blend Details */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Input
            label="Blend Name"
            placeholder="My Awesome Blend"
            value={name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
          />
          
          <Select
            label="Time Range"
            value={timeRange}
            onChange={(e) => updateField('timeRange', e.target.value)}
            options={[
              { value: 'short_term', label: 'Last 4 weeks' },
              { value: 'medium_term', label: 'Last 6 months' },
              { value: 'long_term', label: 'All time' },
            ]}
          />
        </div>
      )}

      {/* Step 2: Friend Selection */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <FriendSelector
            selectedFriend={friendId}
            onSelect={(id) => updateField('friendId', id)}
            error={errors.friendId}
          />
        </div>
      )}

      {/* Step 3: Algorithm Settings */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Select
            label="Blend Algorithm"
            value={algorithm}
            onChange={(e) => updateField('algorithm', e.target.value)}
            options={[
              { value: 'interleave', label: 'Interleave - Alternate tracks' },
              { value: 'weighted', label: 'Weighted - Based on listening habits' },
              { value: 'discovery', label: 'Discovery - Include similar tracks' },
            ]}
          />
          
          <RangeSlider
            label={`Track Count: ${trackCount}`}
            min={20}
            max={100}
            value={trackCount}
            onChange={(value) => updateField('trackCount', value)}
          />
        </div>
      )}
    </div>
  );
};
```

## Feature Components (Organisms)

### Authentication Features
```typescript
// components/features/auth/AuthGuard/AuthGuard.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  if (loading) {
    return <LoadingSpinner center size="lg" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

// components/features/auth/OAuthCallback/OAuthCallback.tsx
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const OAuthCallback: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      
      if (error) {
        router.push('/login?error=' + encodeURIComponent(error));
        return;
      }

      // Refresh user data after successful OAuth
      await refreshUser();
      router.push('/dashboard');
    };

    handleCallback();
  }, [searchParams, refreshUser, router]);

  return (
    <div className="hero min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <LoadingSpinner size="lg" />
          <h1 className="text-2xl font-bold mt-4">Completing sign in...</h1>
          <p className="py-4">Please wait while we set up your account.</p>
        </div>
      </div>
    </div>
  );
};
```

### Dashboard Features
```typescript
// components/features/dashboard/ProviderConnections/ProviderConnections.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProviders } from '@/contexts/ProvidersContext';
import { ProviderIcon } from '@/components/ui/Icons';

export const ProviderConnections: React.FC = () => {
  const { connections, loading, syncTracks, syncingProviders } = useProviders();

  if (loading) {
    return <ProviderConnectionsSkeleton />;
  }

  const getConnection = (provider: 'spotify' | 'apple') => 
    connections.find(conn => conn.provider === provider);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Music Providers</Card.Title>
        <Card.Description>
          Connect your music streaming accounts
        </Card.Description>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        {(['spotify', 'apple'] as const).map(provider => {
          const connection = getConnection(provider);
          const isSyncing = syncingProviders.has(provider);
          
          return (
            <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <ProviderIcon provider={provider} className="w-8 h-8" />
                <div>
                  <h3 className="font-medium capitalize">{provider}</h3>
                  {connection ? (
                    <p className="text-sm opacity-70">
                      Connected • Last sync: {formatDate(connection.updatedAt)}
                    </p>
                  ) : (
                    <p className="text-sm opacity-70">Not connected</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {connection ? (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isSyncing}
                    onClick={() => syncTracks(provider)}
                  >
                    Sync Tracks
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = `/api/auth/${provider}`}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </Card.Body>
    </Card>
  );
};

// Skeleton component for loading state
const ProviderConnectionsSkeleton = () => (
  <Card>
    <Card.Header>
      <div className="skeleton h-6 w-32"></div>
      <div className="skeleton h-4 w-48"></div>
    </Card.Header>
    <Card.Body className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full"></div>
            <div>
              <div className="skeleton h-4 w-16"></div>
              <div className="skeleton h-3 w-24 mt-1"></div>
            </div>
          </div>
          <div className="skeleton h-8 w-20"></div>
        </div>
      ))}
    </Card.Body>
  </Card>
);
```

### Blend Features
```typescript
// components/features/blend/CreateBlendModal/CreateBlendModal.tsx
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BlendForm } from '@/components/forms/BlendForm';
import { useBlend } from '@/contexts/BlendContext';
import { BlendProvider } from '@/contexts/BlendContext';

interface CreateBlendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBlendModalContent: React.FC<CreateBlendModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const {
    createBlend,
    loading,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    isValid,
    resetForm,
  } = useBlend();

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      handleCreate();
    } else {
      nextStep();
    }
  };

  const handleCreate = async () => {
    const success = await createBlend();
    if (success) {
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <Modal.Header>
        <Modal.Title>Create New Blend</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <BlendForm />
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? handleClose : prevStep}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
            loading={loading}
            disabled={!isValid}
          >
            {currentStep === totalSteps ? 'Create Blend' : 'Next'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// Wrap with BlendProvider
export const CreateBlendModal: React.FC<CreateBlendModalProps> = (props) => (
  <BlendProvider>
    <CreateBlendModalContent {...props} />
  </BlendProvider>
);
```

## Layout Components

### Navbar Component
```typescript
// components/layout/Navbar/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleSidebar } = useUI();

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          ☰
        </Button>
        
        {/* Logo */}
        <Link href="/" className="btn btn-ghost text-xl">
          <Logo />
          Blendify
        </Link>
      </div>

      {/* Desktop navigation */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/blend">Blends</Link></li>
          <li><Link href="/settings">Settings</Link></li>
        </ul>
      </div>

      <div className="navbar-end">
        {isAuthenticated ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <Avatar user={user} size="sm" />
            </div>
            <ul className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <Link href="/profile" className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </Link>
              </li>
              <li><Link href="/settings">Settings</Link></li>
              <li><button onClick={logout}>Logout</button></li>
            </ul>
          </div>
        ) : (
          <Button variant="primary" asLink href="/login">
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};
```

## Component Testing Strategy

### Testing Structure
```typescript
// Each component folder includes:
Component/
├── Component.tsx          # Main component
├── Component.types.ts     # TypeScript interfaces
├── Component.utils.ts     # Helper functions
├── Component.test.tsx     # Unit tests
├── Component.stories.tsx  # Storybook stories (optional)
└── index.ts              # Barrel export
```

### Test Patterns
```typescript
// Unit tests focus on:
// 1. Rendering with different props
// 2. User interactions
// 3. State changes
// 4. Error handling

describe('CreateBlendModal', () => {
  it('renders modal when open', () => {
    render(<CreateBlendModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('Create New Blend')).toBeInTheDocument();
  });

  it('progresses through steps', async () => {
    const user = userEvent.setup();
    render(<CreateBlendModal isOpen={true} onClose={jest.fn()} />);
    
    // Fill step 1
    await user.type(screen.getByLabelText('Blend Name'), 'Test Blend');
    await user.click(screen.getByText('Next'));
    
    // Should be on step 2
    expect(screen.getByText('Select Friend')).toBeInTheDocument();
  });
});
```

This architecture provides:
- **Reusability**: Components can be used across different features
- **Maintainability**: Clear separation of concerns and consistent patterns
- **Testability**: Each component is isolated and easily testable
- **Scalability**: Easy to add new components following established patterns
- **Type Safety**: Full TypeScript coverage with proper interfaces
- **Performance**: Optimized with React.memo and proper context usage