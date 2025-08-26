# Component Behaviors

## Input Components

### Provider Connection Button
**States**: Default, Hover, Loading, Connected, Error
**Behavior**:
- Default: Shows provider logo + "Connect" text
- Hover: Slight scale (1.05) and shadow elevation
- Click: Initiates OAuth flow in same tab
- Loading: Spinner replaces text, button disabled
- Connected: Check mark + "Connected" + last sync time
- Error: Red border + error message below
- Validation: None required
- Accessibility: ARIA label describes provider

### Blend Name Input
**States**: Empty, Focused, Filled, Error
**Behavior**:
- Placeholder: "Give your blend a name..."
- Max length: 50 characters
- Character counter: Shows when > 40 chars
- Auto-suggestion: Based on participants + date
- Validation: Required, min 3 chars
- Error message: "Blend name must be 3-50 characters"
- Debounce: 300ms for validation

### Friend Search Input
**States**: Empty, Typing, Results, No Results, Selected
**Behavior**:
- Placeholder: "Search by username or email..."
- Debounce: 500ms before search
- Min chars: 2 to trigger search
- Results dropdown: Max 5 results shown
- Keyboard nav: Arrow keys to navigate results
- Selection: Click or Enter to select
- No results: "No friends found. Send an invite?"
- Recent friends: Shown when focused but empty
- Loading: Skeleton results during search

### Track Count Slider
**States**: Default, Dragging, Hover
**Behavior**:
- Range: 20-100 tracks
- Step: 5 tracks
- Default: 50 tracks
- Visual feedback: Number updates in real-time
- Tooltip: Shows current value on hover/drag
- Snap points: At 25, 50, 75 for common values
- Accessibility: Keyboard arrows adjust by step

### Time Range Radio Group
**States**: Selected, Unselected, Hover, Disabled
**Behavior**:
- Options: "Last 4 weeks", "Last 6 months", "All time"
- Default: "Last 6 months"
- Single selection only
- Transition: 200ms fade between states
- Disabled: When provider doesn't support time ranges
- Help text: Explains what each range means on hover

## Button Components

### Primary Action Button (Create Blend, Connect, Export)
**States**: Default, Hover, Active, Loading, Disabled, Success
**Behavior**:
- Hover: Background darkens 10%, cursor pointer
- Active: Scale(0.98) on mousedown
- Loading: Spinner + disable interaction
- Success: Check animation then reset after 2s
- Disabled: Opacity 50%, cursor not-allowed
- Min width: 120px to prevent layout shift
- Click feedback: Ripple effect from click point

### Secondary Button (Cancel, Skip, Later)
**States**: Default, Hover, Active, Disabled
**Behavior**:
- Ghost style: Transparent bg, border only
- Hover: Light background fill
- Active: Darker background fill
- Always paired with primary action

### Icon Button (Refresh, Settings, Menu)
**States**: Default, Hover, Active, Loading
**Behavior**:
- Size: 40x40px touch target minimum
- Hover: Background circle appears
- Tooltip: Shows action name after 500ms hover
- Loading: Icon replaced with spinner
- Accessibility: Clear ARIA labels

## Card Components

### Provider Card
**States**: Disconnected, Connected, Syncing, Error
**Behavior**:
- Disconnected: Prominent connect CTA
- Connected: Shows stats (tracks, last sync)
- Syncing: Progress bar + "Syncing..." text
- Error: Red accent + "Reconnect" button
- Hover: Slight elevation increase
- Click area: Entire card is clickable when disconnected

### Blend Card
**States**: Default, Hover, Loading, New
**Behavior**:
- Default: Shows cover art grid (4 albums)
- Hover: Scale(1.02) + shadow elevation
- Loading: Skeleton pulse animation
- New badge: For blends < 24 hours old
- Click: Navigate to blend details
- Long press (mobile): Show quick actions menu

### Track Row
**States**: Default, Hover, Playing, Selected
**Behavior**:
- Hover: Light background highlight
- Playing: Animated equalizer icon
- Double-click: Play track in provider app
- Selection: Checkbox appears on hover
- Swipe (mobile): Reveal delete action
- Attribution: Shows contributor avatar

## Modal Components

### Create Blend Modal
**States**: Opening, Open, Closing
**Behavior**:
- Opening: Fade in backdrop + slide up content
- ESC key: Closes modal with confirmation if dirty
- Click outside: Same as ESC
- Step transitions: Slide left/right between steps
- Validation: Per step, blocks progression
- Auto-focus: First input on each step
- Mobile: Full screen takeover

### Share Modal
**States**: Default, Link Copied, QR Shown
**Behavior**:
- Copy button: Changes to "Copied!" for 2s
- QR toggle: Smooth height animation
- Social buttons: Open in new tab
- Link preview: Shows how it appears when shared
- Analytics: Track which share method used

## Loading States

### Skeleton Loaders
**Behavior**:
- Pulse animation: 1.5s duration
- Gradient: Moves left to right
- Height matches content it's replacing
- Stagger: Multiple skeletons load with 100ms delay
- Never show < 200ms to prevent flash

### Progress Indicators
**Types**: Linear, Circular, Step
**Behavior**:
- Linear: For known progress (0-100%)
- Circular: For indeterminate loading
- Step: For multi-step processes
- Always include text description
- Smooth transitions between percentages

## Toast Notifications

### Toast Types
**Success**: Green accent, auto-dismiss 3s
**Error**: Red accent, manual dismiss required
**Warning**: Yellow accent, auto-dismiss 5s
**Info**: Blue accent, auto-dismiss 4s

**Behavior**:
- Position: Top-right desktop, top mobile
- Stack: Max 3 visible, others queue
- Animation: Slide in from right
- Action button: Optional, right-aligned
- Swipe to dismiss on mobile
- Click to dismiss on desktop

## Empty States

### No Data States
**Behavior**:
- Illustration: Friendly, relevant to context
- Heading: Clear description of what's missing
- Body text: Explain why and what to do
- CTA: Primary action to resolve state
- Animation: Subtle fade in

## Form Validation

### Validation Timing
- On blur: For individual fields
- On submit: For entire form
- On change: Only after first error
- Async validation: Show loading state

### Error Display
- Field level: Red border + message below
- Form level: Alert box at top
- Inline help: (?) icon with tooltip
- Success: Green check when corrected

## Responsive Behaviors

### Breakpoint Transitions
- Mobile → Tablet: 640px
  - Stack → Side-by-side layouts
  - Bottom nav → Sidebar
  - Full modals → Centered modals

- Tablet → Desktop: 1024px
  - 2 column → 3 column grids
  - Compact cards → Expanded cards
  - Touch targets → Hover states

### Touch Gestures (Mobile)
- Swipe left/right: Navigate between tabs
- Pull to refresh: Sync data
- Long press: Context menu
- Pinch to zoom: Album art preview
- Swipe up: Dismiss modals

## Accessibility Features

### Keyboard Navigation
- Tab order: Logical flow through UI
- Focus rings: Visible but subtle
- Skip links: "Skip to main content"
- Shortcuts: 
  - `/` - Focus search
  - `ESC` - Close modals
  - `Space` - Play/pause
  - `N` - New blend

### Screen Reader Support
- ARIA labels: All interactive elements
- Live regions: For dynamic content
- Landmarks: Header, main, navigation
- Alt text: All images and icons
- Status announcements: Loading, errors, success

## Performance Optimizations

### Lazy Loading
- Images: Load on intersection
- Routes: Code split by route
- Modals: Load on first open
- Heavy components: Load on demand

### Optimistic UI
- Immediate feedback for all actions
- Update UI before server confirms
- Rollback on error with explanation
- Queue actions when offline

### Caching Strategy
- Provider data: 1 hour
- User profile: 24 hours
- Blend results: Indefinite
- Images: Browser cache + CDN
- API responses: 5 minute SWR