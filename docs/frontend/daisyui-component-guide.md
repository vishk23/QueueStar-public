# daisyUI Component Guide for Blendify

## Installation & Setup

### Install daisyUI
```bash
npm i -D daisyui@latest
```

### Tailwind Config Setup
```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'cupcake', 'cyberpunk'], // Choose themes
    base: true, // Apply background color and foreground color for root element
    styled: true, // Include daisyUI colors and design decisions
    utils: true, // Add responsive and modifier utility classes
  },
};
export default config;
```

## Core Components for Authentication

### Button Component
```typescript
// Multiple variants and sizes
<button className="btn">Button</button>
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-accent">Accent</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-link">Link</button>

// Sizes
<button className="btn btn-lg">Large</button>
<button className="btn btn-md">Medium</button>
<button className="btn btn-sm">Small</button>
<button className="btn btn-xs">Extra Small</button>

// States
<button className="btn btn-primary loading">Loading</button>
<button className="btn btn-primary" disabled>Disabled</button>

// Usage in our app
export const ProviderButton = ({ provider, onClick, loading }) => (
  <button 
    className={`btn btn-outline w-full ${loading ? 'loading' : ''}`}
    onClick={onClick}
    disabled={loading}
  >
    {!loading && (
      <>
        {provider === 'spotify' ? <SpotifyIcon /> : <AppleMusicIcon />}
        Connect with {provider === 'spotify' ? 'Spotify' : 'Apple Music'}
      </>
    )}
  </button>
);
```

### Input Component
```typescript
// Basic input
<input type="text" className="input input-bordered w-full" />

// With label and helper text
<div className="form-control w-full">
  <label className="label">
    <span className="label-text">Blend Name</span>
  </label>
  <input 
    type="text" 
    placeholder="Enter a name for your blend"
    className="input input-bordered w-full" 
  />
  <label className="label">
    <span className="label-text-alt">Choose something memorable</span>
  </label>
</div>

// Error state
<input 
  type="text" 
  className="input input-bordered input-error w-full" 
  placeholder="Error state"
/>

// Usage in our forms
export const BlendNameInput = ({ value, onChange, error }) => (
  <div className="form-control w-full">
    <label className="label">
      <span className="label-text">Blend Name</span>
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
      placeholder="My awesome blend"
    />
    {error && (
      <label className="label">
        <span className="label-text-alt text-error">{error}</span>
      </label>
    )}
  </div>
);
```

### Modal Component
```typescript
// Basic modal structure
<div className="modal modal-open">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Create New Blend</h3>
    <p className="py-4">Fill in the details to create your blend</p>
    <div className="modal-action">
      <button className="btn">Cancel</button>
      <button className="btn btn-primary">Create</button>
    </div>
  </div>
</div>

// React modal component
export const CreateBlendModal = ({ isOpen, onClose, onSubmit }) => (
  <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
    <div className="modal-box">
      <form method="dialog">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
      </form>
      <h3 className="font-bold text-lg">Create New Blend</h3>
      <div className="py-4">
        {/* Form content */}
      </div>
      <div className="modal-action">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={onSubmit}>Create</button>
      </div>
    </div>
    <div className="modal-backdrop" onClick={onClose}></div>
  </div>
);
```

## Dashboard Components

### Card Component
```typescript
// Basic card
<div className="card w-96 bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Spotify Connection</h2>
    <p>Connected as John Doe</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Sync Tracks</button>
    </div>
  </div>
</div>

// Provider connection card
export const ProviderCard = ({ provider, connection, onSync, onDisconnect }) => (
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <div className="flex items-center gap-3">
        {provider === 'spotify' ? <SpotifyIcon /> : <AppleMusicIcon />}
        <div>
          <h2 className="card-title capitalize">{provider}</h2>
          {connection ? (
            <p className="text-sm opacity-70">Connected as {connection.displayName}</p>
          ) : (
            <p className="text-sm opacity-70">Not connected</p>
          )}
        </div>
      </div>
      
      <div className="card-actions justify-end mt-4">
        {connection ? (
          <>
            <button className="btn btn-sm" onClick={onDisconnect}>
              Disconnect
            </button>
            <button className="btn btn-primary btn-sm" onClick={onSync}>
              Sync Tracks
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => window.location.href = `/api/auth/${provider}`}>
            Connect
          </button>
        )}
      </div>
    </div>
  </div>
);
```

### Avatar Component
```typescript
// Basic avatar
<div className="avatar">
  <div className="w-24 rounded-full">
    <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
  </div>
</div>

// Avatar with online indicator
<div className="avatar online">
  <div className="w-24 rounded-full">
    <img src="/user-avatar.jpg" />
  </div>
</div>

// User avatar component
export const UserAvatar = ({ user, size = 'md', showStatus = false }) => {
  const sizeClasses = {
    sm: 'w-8',
    md: 'w-12',
    lg: 'w-24',
  };

  return (
    <div className={`avatar ${showStatus ? 'online' : ''}`}>
      <div className={`${sizeClasses[size]} rounded-full`}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} />
        ) : (
          <div className="bg-neutral-focus text-neutral-content flex items-center justify-center">
            {user.displayName?.charAt(0) || 'U'}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Navbar Component
```typescript
// Responsive navbar
<div className="navbar bg-base-100">
  <div className="navbar-start">
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      </div>
      <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li><a>Dashboard</a></li>
        <li><a>Blends</a></li>
        <li><a>Settings</a></li>
      </ul>
    </div>
    <a className="btn btn-ghost text-xl">Blendify</a>
  </div>
  
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      <li><a>Dashboard</a></li>
      <li><a>Blends</a></li>
      <li><a>Settings</a></li>
    </ul>
  </div>
  
  <div className="navbar-end">
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full">
          <img alt="User avatar" src="user-avatar.jpg" />
        </div>
      </div>
      <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
        <li><a>Profile</a></li>
        <li><a>Settings</a></li>
        <li><a>Logout</a></li>
      </ul>
    </div>
  </div>
</div>
```

## Form Components

### Select Component
```typescript
// Basic select
<select className="select select-bordered w-full">
  <option disabled selected>Pick your algorithm</option>
  <option>Interleave</option>
  <option>Weighted</option>
  <option>Discovery</option>
</select>

// Algorithm selector component
export const AlgorithmSelect = ({ value, onChange }) => (
  <div className="form-control w-full">
    <label className="label">
      <span className="label-text">Blend Algorithm</span>
    </label>
    <select 
      className="select select-bordered w-full"
      value={value}
      onChange={onChange}
    >
      <option value="">Choose algorithm</option>
      <option value="interleave">Interleave - Alternate between users</option>
      <option value="weighted">Weighted - Based on listening habits</option>
      <option value="discovery">Discovery - Include similar tracks</option>
    </select>
  </div>
);
```

### Range Slider
```typescript
// Track count slider
<div className="form-control">
  <label className="label">
    <span className="label-text">Track Count: {trackCount}</span>
  </label>
  <input 
    type="range" 
    min={20} 
    max={100} 
    value={trackCount}
    className="range range-primary" 
    onChange={(e) => setTrackCount(e.target.value)}
  />
  <div className="w-full flex justify-between text-xs px-2">
    <span>20</span>
    <span>50</span>
    <span>100</span>
  </div>
</div>
```

## Loading & Feedback Components

### Loading Spinner
```typescript
// Various loading states
<span className="loading loading-spinner loading-xs"></span>
<span className="loading loading-spinner loading-sm"></span>
<span className="loading loading-spinner loading-md"></span>
<span className="loading loading-spinner loading-lg"></span>

// Loading component
export const LoadingSpinner = ({ size = 'md', center = false }) => {
  const centerClasses = center ? 'flex justify-center items-center min-h-32' : '';
  
  return (
    <div className={centerClasses}>
      <span className={`loading loading-spinner loading-${size}`}></span>
    </div>
  );
};
```

### Toast/Alert
```typescript
// Success alert
<div className="alert alert-success">
  <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Blend created successfully!</span>
</div>

// Error alert
<div className="alert alert-error">
  <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Error! Failed to create blend.</span>
</div>
```

### Progress Bar
```typescript
// Progress indicator for blend creation
<progress className="progress progress-primary w-56" value="70" max="100"></progress>

// With label
export const BlendProgress = ({ step, totalSteps, currentStep }) => {
  const progress = (step / totalSteps) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{currentStep}</span>
        <span>{step}/{totalSteps}</span>
      </div>
      <progress 
        className="progress progress-primary w-full" 
        value={progress} 
        max="100"
      />
    </div>
  );
};
```

## Theme System

### Theme Configuration
```typescript
// tailwind.config.ts
daisyui: {
  themes: [
    'light',
    'dark', 
    {
      blendify: {
        'primary': '#1db954',        // Spotify green
        'secondary': '#1e3a8a',      // Blue
        'accent': '#f59e0b',         // Amber
        'neutral': '#3d4451',        // Gray
        'base-100': '#ffffff',       // White background
        'info': '#3abff8',           // Info blue
        'success': '#36d399',        // Success green
        'warning': '#fbbd23',        // Warning yellow
        'error': '#f87272',          // Error red
      },
    },
  ],
}

// Theme switcher component
export const ThemeController = () => {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn m-1">
        Theme
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller"
            aria-label="Light"
            value="light"
            onChange={() => setTheme('light')}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller"
            aria-label="Dark"
            value="dark"
            onChange={() => setTheme('dark')}
          />
        </li>
      </ul>
    </div>
  );
};
```

## Best Practices

### Component Composition
```typescript
// Combine daisyUI classes with custom styling
export const MusicCard = ({ track }) => (
  <div className="card card-side bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
    <figure className="w-16 h-16">
      <img src={track.albumArt} alt={track.album} className="object-cover" />
    </figure>
    <div className="card-body p-4">
      <h2 className="card-title text-sm">{track.name}</h2>
      <p className="text-xs opacity-70">{track.artist}</p>
    </div>
  </div>
);
```

### Responsive Design
```typescript
// Use daisyUI's responsive utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards will be 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>

// Responsive navbar
<div className="navbar">
  <div className="navbar-start">
    {/* Hamburger menu for mobile */}
    <div className="dropdown lg:hidden">
      <div tabIndex={0} role="button" className="btn btn-ghost">☰</div>
      <ul className="dropdown-content menu">
        {/* Mobile menu items */}
      </ul>
    </div>
    {/* Logo */}
    <a className="btn btn-ghost text-xl">Blendify</a>
  </div>
  
  {/* Desktop menu */}
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal">
      {/* Desktop menu items */}
    </ul>
  </div>
</div>
```