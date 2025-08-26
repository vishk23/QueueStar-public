# Authentication Flow Wireframes

## Overview
These wireframes show the complete authentication user journey from landing page to dashboard, including all states and error conditions.

## 1. Landing Page (/)

### Desktop Layout (1200px+)
```
┌─────────────────────────────────────────────────────────────────┐
│ Navbar                                                          │
│ ┌─────────┐                                         [Sign In]  │
│ │ Blendify │                                                    │
│ └─────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Hero Section                             │
│                                                                 │
│     ┌─────────────────────────────────────┐  ┌─────────────────┐│
│     │                                     │  │                 ││
│     │        📱 Music Icon                │  │   Login Card    ││
│     │                                     │  │                 ││
│     │    Welcome to Blendify!             │  │  Connect Your   ││
│     │                                     │  │     Music       ││
│     │  Blend music with friends across    │  │                 ││
│     │  Spotify and Apple Music. Create    │  │  ┌─────────────┐││
│     │  collaborative playlists and        │  │  │[🎵 Spotify] │││
│     │  discover new tracks together.      │  │  └─────────────┘││
│     │                                     │  │                 ││
│     │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓│  │  ┌─────────────┐││
│     │  ┃      Statistics Section         ┃│  │  │[🍎 Apple]   │││
│     │  ┃                                 ┃│  │  │[ Music ]    │││
│     │  ┃  Active Users    Blends Created ┃│  │  └─────────────┘││
│     │  ┃      1.2K            5.6K       ┃│  │                 ││
│     │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛│  │   Terms text    ││
│     └─────────────────────────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px-768px)
```
┌─────────────────────────────────────┐
│ ☰  Blendify              [Sign In] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│              📱                     │
│                                     │
│         Welcome to                  │
│          Blendify!                  │
│                                     │
│    Blend music with friends         │
│    across Spotify and Apple         │
│    Music. Create collaborative      │
│    playlists and discover new       │
│    tracks together.                 │
│                                     │
│  ┌─────────────┬─────────────────┐  │
│  │ 1.2K Users  │  5.6K Blends   │  │
│  └─────────────┴─────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        Connect Your Music           │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🎵 Continue with Spotify      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🍎 Continue with Apple Music  │ │
│  └─────────────────────────────────┘ │
│                                     │
│     By continuing, you agree to     │
│    our Terms of Service and Privacy │
│                Policy.               │
└─────────────────────────────────────┘
```

## 2. Login Page (/login)

### Standard State
```
┌─────────────────────────────────────────────────────────────────┐
│                        Navbar                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Hero Background                            │
│                                                                 │
│     ┌─────────────────────────────────┐   ┌─────────────────┐   │
│     │                                 │   │                 │   │
│     │    📱 Welcome to Blendify!      │   │  Connect Music  │   │
│     │                                 │   │                 │   │
│     │  Connect your music accounts    │   │  ┌─────────────┐ │   │
│     │  and create amazing blended     │   │  │[🎵 Spotify] │ │   │
│     │  playlists with friends.        │   │  │   LOADING   │ │   │
│     │                                 │   │  └─────────────┘ │   │
│     │  Discover new music through     │   │                 │   │
│     │  collaborative mixing.          │   │  ┌─────────────┐ │   │
│     │                                 │   │  │[🍎 Apple   ]│ │   │
│     │  • Cross-platform blending     │   │  │[ Music     ]│ │   │
│     │  • Smart recommendation        │   │  └─────────────┘ │   │
│     │  • Share with friends          │   │                 │   │
│     │                                 │   │  Terms text...  │   │
│     └─────────────────────────────────┘   └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────┐
│          Connect Music              │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ ❌ Authentication failed.       │ │
│  │    Please try again.            │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🎵 Continue with Spotify      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🍎 Continue with Apple Music  │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Loading State (Button Level)
```
┌─────────────────────────────────────┐
│          Connect Music              │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  ⟳ Connecting to Spotify...   │ │  ← Loading state
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🍎 Continue with Apple Music  │ │  ← Disabled
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 3. OAuth Callback Page (/callback/[provider])

### Loading State
```
┌─────────────────────────────────────────────────────────────────┐
│                        Full Screen                              │
│                                                                 │
│                          ⟳                                     │
│                                                                 │
│                Completing sign in...                           │
│                                                                 │
│           Please wait while we connect                         │
│              your Spotify account.                             │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Success State (Brief)
```
┌─────────────────────────────────────────────────────────────────┐
│                        Full Screen                              │
│                                                                 │
│                          ✅                                    │
│                                                                 │
│              Successfully Connected!                           │
│                                                                 │
│            Your Spotify account has been                       │
│                   connected.                                   │
│                                                                 │
│              Redirecting to dashboard...                       │
└─────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────┐
│                        Full Screen                              │
│                                                                 │
│                          ❌                                    │
│                                                                 │
│              Authentication Failed                             │
│                                                                 │
│               User denied access                               │
│                                                                 │
│              Redirecting to login page...                     │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Dashboard (First Visit)

### Empty State - No Providers
```
┌─────────────────────────────────────────────────────────────────┐
│ Navbar: Blendify           Dashboard | Blends        👤 John   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Dashboard                               │
│                                           [Create New Blend]   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Welcome, John! 👋                           │
│                                                                 │
│            Let's get started by connecting your                 │
│                   music streaming accounts                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                Music Providers                              ││
│  │                                                             ││
│  │  🎵 Spotify          Not connected    [Connect]            ││
│  │  🍎 Apple Music      Not connected    [Connect]            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Recent Blends                             ││
│  │                                                             ││
│  │           No blends yet. Create your first!                 ││
│  │                                                             ││
│  │                 [Create New Blend]                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### One Provider Connected
```
┌─────────────────────────────────────────────────────────────────┐
│                         Dashboard                               │
│                                           [Create New Blend]   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────┬───────────────┬───────────────────┐  │
│  │  Connected Providers  │  Total Tracks │    Active Blends  │  │
│  │          1            │      127      │        0          │  │
│  └───────────────────────┴───────────────┴───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                Music Providers                              ││
│  │                                                             ││
│  │  🎵 Spotify         ✅ Connected as @john  [Sync Tracks]   ││
│  │     Last sync: 2 hours ago                                 ││
│  │                                                             ││
│  │  🍎 Apple Music     Not connected         [Connect]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Recent Blends                             ││
│  │                                                             ││
│  │      🎧 Connect Apple Music to start blending!             ││
│  │                                                             ││
│  │     Blending works best with multiple providers            ││
│  │                 [Connect Apple Music]                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 5. Protected Route Access (No Auth)

### Redirect Flow
```
User visits /dashboard
          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Loading...                                 │
│                        ⟳                                       │
└─────────────────────────────────────────────────────────────────┘
          ↓ (After auth check fails)
Redirect to /login?returnUrl=%2Fdashboard
```

## 6. Mobile Responsive Breakpoints

### Mobile Navigation (< 768px)
```
┌─────────────────────────────────────┐
│ ☰  Blendify                    👤  │
└─────────────────────────────────────┘

<!-- Sidebar (when opened) -->
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │             Sidebar             │ │
│ │                                 │ │
│ │  Dashboard                      │ │
│ │  Blends                         │ │
│ │  Settings                       │ │
│ │                                 │ │
│ │  ──────────────────────────────  │ │
│ │                                 │ │
│ │  John Doe                       │ │
│ │  john@example.com               │ │
│ │                                 │ │
│ │  [Logout]                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Mobile Provider Cards (Stacked)
```
┌─────────────────────────────────────┐
│         Music Providers             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🎵 Spotify                     │ │
│ │  ✅ Connected as @john          │ │
│ │  Last sync: 2 hours ago         │ │
│ │                                 │ │
│ │           [Sync Tracks]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🍎 Apple Music                 │ │
│ │  Not connected                  │ │
│ │                                 │ │
│ │            [Connect]            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 7. User Flow Diagram

```
     Start
       │
   ┌───▼────┐     ┌─────────────┐
   │Landing │────▶│ Login Page  │
   │  Page  │     │             │
   └────────┘     └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │Select Provider│
                  └──────┬──────┘
                         │
          ┌──────────────▼──────────────┐
          │                             │
    ┌─────▼─────┐                ┌─────▼─────┐
    │  Spotify  │                │   Apple   │
    │   OAuth   │                │   Music   │
    └─────┬─────┘                │   OAuth   │
          │                      └─────┬─────┘
          │                            │
          └──────────┬───────────────────┘
                     │
              ┌──────▼──────┐
              │   Callback  │
              │   Page      │
              └──────┬──────┘
                     │
                ┌────▼──────┐
                │Dashboard  │
                │(First Time│
                │   Visit)  │
                └───────────┘
```

## 8. Error Scenarios

### Network Error
```
┌─────────────────────────────────────┐
│          Connect Music              │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ ⚠️  Connection failed.          │ │
│  │    Check your internet and      │ │
│  │    try again.                   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Try Again]  [Use Different Provider]│
└─────────────────────────────────────┘
```

### Provider Maintenance
```
┌─────────────────────────────────────┐
│          Connect Music              │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 🔧 Spotify is currently under   │ │
│  │    maintenance. Please try      │ │
│  │    Apple Music instead.         │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🍎 Continue with Apple Music  │ │ ← Available
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  🎵 Spotify (Unavailable)      │ │ ← Disabled
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 9. Accessibility Considerations

### Screen Reader Flow
```
1. "Welcome to Blendify heading level 1"
2. "Connect your music streaming service"
3. "Button: Continue with Spotify"
4. "Button: Continue with Apple Music" 
5. "Terms of service link"
```

### Keyboard Navigation
```
Tab Order:
1. Skip to main content (hidden)
2. Spotify button
3. Apple Music button
4. Terms link
5. Privacy link

Enter/Space: Activate buttons
Escape: Close modals/dropdowns
```

### High Contrast Mode
```
- Use semantic colors (success, error, warning)
- Ensure 4.5:1 contrast ratio minimum
- Use icons AND text for status indicators
- Clear focus indicators on interactive elements
```

These wireframes provide a comprehensive visual guide for implementing the authentication system with proper states, responsive design, and accessibility considerations.