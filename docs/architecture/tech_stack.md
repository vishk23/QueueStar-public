# Tech Stack Rationale

## Frontend Framework
### Next.js 14 (App Router)
- **Why**: Server components for secure API key handling, built-in API routes for OAuth flows, excellent TypeScript support
- **App Router Benefits**: Simplified data fetching, streaming SSR, parallel routes for modals
- **Edge Runtime**: Compatible with Vercel Edge Functions for low latency

## Styling
### Tailwind CSS + daisyUI
- **Tailwind**: Utility-first for rapid prototyping, excellent IDE support, minimal CSS bundle
- **daisyUI**: Pre-built components (modals, buttons, forms), consistent design system, dark mode support built-in
- **Why Both**: Tailwind for custom layouts, daisyUI for complex components

## Database & ORM
### Supabase (PostgreSQL with RLS)
- **Why Supabase**: 
  - Row Level Security for multi-tenant data isolation
  - Real-time subscriptions for collaborative features (future)
  - Built-in auth (backup option if OAuth fails)
  - Generous free tier
- **Why PostgreSQL**: JSONB for flexible provider metadata, reliable for user tokens

### Drizzle ORM
- **Why**: 
  - TypeScript-first with perfect type inference
  - Lightweight (40% smaller than Prisma)
  - SQL-like syntax familiar to developers
  - Edge-compatible for Vercel Edge Functions
  - Excellent migration tooling

## Deployment
### Vercel
- **Why**: 
  - Zero-config Next.js deployment
  - Automatic preview deployments
  - Edge Functions for API routes
  - Environment variable management
  - Analytics and monitoring included

## Authentication Strategy
### Custom OAuth Implementation
- **Why Not NextAuth**: 
  - Need fine-grained control over token refresh
  - Custom token encryption requirements
  - Provider-specific refresh logic (Apple's 6-month limit)
- **Approach**: Direct OAuth with PKCE for both providers

## State Management
### React Context + Zustand (if needed)
- **Context**: For auth state and user preferences
- **Zustand**: Only if complex client state emerges
- **Why**: Minimal overhead, TypeScript-friendly, no boilerplate

## API Integration
### Native Fetch + React Query
- **Fetch**: Built into Next.js, no additional dependencies
- **React Query**: Caching, background refetch, optimistic updates
- **Why**: Battle-tested, excellent DX, handles offline state

## Testing
### Vitest + Playwright
- **Vitest**: Fast unit tests, Jest-compatible, ESM-first
- **Playwright**: E2E testing, cross-browser, reliable selectors
- **Why**: Modern tooling, fast execution, great debugging

## Development Tools
### TypeScript (Strict Mode)
- **Why**: Catch errors at compile time, excellent IDE support, self-documenting code

### ESLint + Prettier
- **ESLint**: Next.js recommended rules + custom rules
- **Prettier**: Consistent formatting, zero-debate code style

## Security Considerations
- **Token Storage**: Encrypted httpOnly cookies for refresh tokens
- **CSRF Protection**: SameSite cookies + CSRF tokens
- **Rate Limiting**: Upstash Redis for API rate limiting
- **Environment Variables**: Vercel secrets for production keys

## Performance Optimizations
- **Image Optimization**: Next.js Image component for album art
- **Code Splitting**: Automatic with Next.js App Router
- **Font Optimization**: Next.js Font for system fonts
- **Caching**: ISR for static pages, SWR for client data

## Future Considerations
- **WebSockets**: For real-time blend updates (Supabase Realtime)
- **Push Notifications**: Web Push API for blend invites
- **Analytics**: Vercel Analytics or PostHog
- **Error Tracking**: Sentry for production monitoring