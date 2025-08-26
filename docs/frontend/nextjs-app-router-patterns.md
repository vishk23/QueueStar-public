# Next.js 14 App Router Patterns

## File-based Routing Structure

### Our App Structure
```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx               # Home page (/)
├── loading.tsx            # Global loading UI
├── error.tsx              # Global error UI
├── not-found.tsx          # 404 page
├── (auth)/                # Route group - doesn't affect URL
│   ├── layout.tsx         # Auth layout
│   ├── login/
│   │   └── page.tsx       # /login
│   └── callback/
│       ├── spotify/
│       │   └── page.tsx   # /callback/spotify
│       └── apple/
│           └── page.tsx   # /callback/apple
├── (dashboard)/           # Route group - doesn't affect URL
│   ├── layout.tsx         # Dashboard layout
│   ├── dashboard/
│   │   └── page.tsx       # /dashboard
│   ├── blend/
│   │   ├── page.tsx       # /blend (blend list)
│   │   ├── create/
│   │   │   └── page.tsx   # /blend/create
│   │   └── [id]/
│   │       ├── page.tsx   # /blend/[id]
│   │       └── edit/
│   │           └── page.tsx # /blend/[id]/edit
│   └── settings/
│       └── page.tsx       # /settings
└── share/
    └── [code]/
        └── page.tsx       # /share/[code] (public blend view)
```

## Layout Patterns

### Root Layout (Required)
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blendify - Blend Music with Friends',
  description: 'Create and share blended playlists with friends using Spotify and Apple Music',
  keywords: ['music', 'playlist', 'spotify', 'apple music', 'friends'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Auth Layout (Route Group)
```typescript
// app/(auth)/layout.tsx
import { Suspense } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Auth pages don't need authentication guard */}
      <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
        {children}
      </Suspense>
    </div>
  );
}
```

### Dashboard Layout (Protected)
```typescript
// app/(dashboard)/layout.tsx
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-base-100">
        <Navbar />
        <div className="flex">
          <Sidebar className="hidden lg:block w-64" />
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
```

## Page Components

### Login Page
```typescript
// app/(auth)/login/page.tsx
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server';

export const metadata: Metadata = {
  title: 'Login - Blendify',
  description: 'Sign in to Blendify with your music streaming service',
};

export default async function LoginPage() {
  // Check if user is already authenticated
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Welcome to Blendify!</h1>
          <p className="py-6">
            Connect your music accounts and create amazing blended playlists with friends.
          </p>
        </div>
        <div className="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Dashboard Page
```typescript
// app/(dashboard)/dashboard/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProviderConnections } from '@/components/dashboard/ProviderConnections';
import { RecentBlends } from '@/components/dashboard/RecentBlends';
import { DashboardStats } from '@/components/dashboard/DashboardStats';

export const metadata: Metadata = {
  title: 'Dashboard - Blendify',
  description: 'Your music blending dashboard',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button className="btn btn-primary">
          Create New Blend
        </button>
      </div>
      
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ProviderConnectionsSkeleton />}>
          <ProviderConnections />
        </Suspense>
        
        <Suspense fallback={<RecentBlendsSkeleton />}>
          <RecentBlends />
        </Suspense>
      </div>
    </div>
  );
}

// Skeleton components for loading states
const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="skeleton h-24 w-full"></div>
    ))}
  </div>
);
```

### Dynamic Route Page
```typescript
// app/(dashboard)/blend/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlendView } from '@/components/blend/BlendView';
import { getBlend } from '@/lib/api/blends';

interface BlendPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: BlendPageProps): Promise<Metadata> {
  try {
    const blend = await getBlend(params.id);
    
    return {
      title: `${blend.name} - Blendify`,
      description: `A blended playlist created on Blendify with ${blend.participants.length} participants`,
    };
  } catch {
    return {
      title: 'Blend Not Found - Blendify',
    };
  }
}

export default async function BlendPage({ params }: BlendPageProps) {
  try {
    const blend = await getBlend(params.id);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{blend.name}</h1>
          <div className="flex gap-2">
            <button className="btn btn-outline">
              Share
            </button>
            <button className="btn btn-primary">
              Export to Playlist
            </button>
          </div>
        </div>
        
        <BlendView blend={blend} />
      </div>
    );
  } catch (error) {
    console.error('Error loading blend:', error);
    notFound();
  }
}
```

## Server Components vs Client Components

### Server Component (Default)
```typescript
// app/dashboard/page.tsx - Server Component
import { getServerSession } from '@/lib/auth/server';
import { getUserBlends } from '@/lib/api/blends';
import { BlendList } from '@/components/blend/BlendList';

export default async function DashboardPage() {
  // This runs on the server
  const session = await getServerSession();
  const blends = await getUserBlends(session.userId);

  return (
    <div>
      <h1>Welcome, {session.user.displayName}</h1>
      {/* BlendList can be a client component for interactivity */}
      <BlendList blends={blends} />
    </div>
  );
}
```

### Client Component
```typescript
// components/blend/CreateBlendButton.tsx - Client Component
'use client';

import { useState } from 'react';
import { CreateBlendModal } from './CreateBlendModal';

export const CreateBlendButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        Create New Blend
      </button>
      
      {isModalOpen && (
        <CreateBlendModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
```

## Loading and Error Handling

### Loading UI
```typescript
// app/(dashboard)/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-48"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-24 w-full"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 w-full"></div>
        <div className="skeleton h-64 w-full"></div>
      </div>
    </div>
  );
}
```

### Error UI
```typescript
// app/(dashboard)/dashboard/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="hero min-h-96">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-error">Something went wrong!</h1>
          <p className="py-4">
            We encountered an error loading your dashboard.
          </p>
          <button
            className="btn btn-primary"
            onClick={reset}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Not Found
```typescript
// app/(dashboard)/blend/[id]/not-found.tsx
export default function BlendNotFound() {
  return (
    <div className="hero min-h-96">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Blend Not Found</h1>
          <p className="py-4">
            The blend you're looking for doesn't exist or you don't have access to it.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
```

## Navigation Patterns

### Server-side Navigation
```typescript
// In server components or actions
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  // ... authentication logic
  
  if (success) {
    redirect('/dashboard');
  }
}
```

### Client-side Navigation
```typescript
// In client components
'use client';

import { useRouter } from 'next/navigation';

export const NavigationComponent = () => {
  const router = useRouter();
  
  const handleNavigate = () => {
    router.push('/dashboard');
    // or
    router.replace('/login'); // No back button
  };
  
  return (
    <button onClick={handleNavigate}>
      Go to Dashboard
    </button>
  );
};
```

## Middleware for Auth

```typescript
// middleware.ts (root level)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userSession = request.cookies.get('user_session');
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/share'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is not authenticated and trying to access protected route
  if (!userSession && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access auth pages
  if (userSession && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Data Fetching Patterns

### Server-side Data Fetching
```typescript
// In server components
async function getBlends(userId: string) {
  const res = await fetch(`${process.env.API_URL}/api/blend?userId=${userId}`, {
    headers: {
      'Authorization': `Bearer ${serverToken}`,
    },
    // Next.js specific caching
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blends');
  }
  
  return res.json();
}
```

### Client-side Data Fetching
```typescript
// Custom hook for client-side fetching
'use client';

import { useState, useEffect } from 'react';

export const useBlends = () => {
  const [blends, setBlends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/blend')
      .then(res => res.json())
      .then(data => {
        setBlends(data.blends);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { blends, loading, error };
};
```

## Route Groups and Organization

```
app/
├── (auth)/                # Route group - doesn't affect URL structure
│   ├── layout.tsx         # Shared layout for auth pages
│   ├── login/
│   └── callback/
├── (dashboard)/           # Route group - doesn't affect URL structure  
│   ├── layout.tsx         # Shared layout for dashboard pages
│   ├── dashboard/
│   ├── blend/
│   └── settings/
└── (public)/              # Route group for public pages
    ├── layout.tsx         # Public layout
    └── share/
```

This organization allows us to:
- Share layouts between related pages
- Keep the URL structure clean
- Organize code logically
- Apply different authentication rules per group