# User Flows

## 1. Account Connect Flow

### First-Time User Journey

```mermaid
flowchart TD
    Start([User visits Blendify]) --> Landing[Landing Page]
    Landing --> ClickConnect{Click Connect Provider}
    
    ClickConnect -->|Spotify| SpotifyAuth[Spotify OAuth]
    ClickConnect -->|Apple Music| AppleAuth[Apple Music Auth]
    
    SpotifyAuth --> SpotifyConsent[Spotify Consent Screen]
    SpotifyConsent -->|Approve| SpotifyCallback[Return to App]
    SpotifyConsent -->|Deny| AuthError[Show Error]
    
    AppleAuth --> AppleLogin[Apple ID Login]
    AppleLogin --> AppleConsent[Apple Music Access]
    AppleConsent -->|Approve| AppleCallback[Return to App]
    AppleConsent -->|Deny| AuthError
    
    SpotifyCallback --> StoreTokens[Encrypt & Store Tokens]
    AppleCallback --> StoreTokens
    
    StoreTokens --> FetchProfile[Fetch User Profile]
    FetchProfile --> CreateUser{User Exists?}
    
    CreateUser -->|No| NewUser[Create User Record]
    CreateUser -->|Yes| UpdateUser[Update Connection]
    
    NewUser --> SyncTracks[Sync Top Tracks]
    UpdateUser --> SyncTracks
    
    SyncTracks --> Dashboard[Redirect to Dashboard]
    AuthError --> Landing
    
    Dashboard --> ShowOnboarding{First Provider?}
    ShowOnboarding -->|Yes| OnboardingModal[Show Welcome Tour]
    ShowOnboarding -->|No| MainDashboard[Show Dashboard]
    
    OnboardingModal --> MainDashboard
```

### Returning User Connect Second Provider

```mermaid
flowchart TD
    Start([User in Dashboard]) --> ProviderCard[Provider Card Empty]
    ProviderCard --> ClickAdd[Click Add Provider]
    
    ClickAdd --> SelectProvider{Which Provider?}
    SelectProvider -->|Already has Spotify| AppleFlow[Apple Music Auth]
    SelectProvider -->|Already has Apple| SpotifyFlow[Spotify Auth]
    
    SpotifyFlow --> SpotifyAuth[OAuth Flow]
    AppleFlow --> AppleAuth[MusicKit Auth]
    
    SpotifyAuth --> StoreConnection[Add Provider Connection]
    AppleAuth --> StoreConnection
    
    StoreConnection --> SyncNewTracks[Sync Provider Tracks]
    SyncNewTracks --> UpdateUI[Update Dashboard]
    UpdateUI --> ShowSuccess[Toast: Provider Connected]
```

## 2. Blend Creation Flow

### Standard Blend Flow

```mermaid
flowchart TD
    Start([User in Dashboard]) --> CreateButton[Click Create Blend]
    CreateButton --> CheckProviders{Has Provider?}
    
    CheckProviders -->|No| ShowError[Show Connect Provider Modal]
    CheckProviders -->|Yes| BlendModal[Open Blend Creation Modal]
    
    ShowError --> ConnectFirst[User Connects Provider]
    ConnectFirst --> BlendModal
    
    BlendModal --> Step1[Step 1: Name Your Blend]
    Step1 --> EnterName[Enter Blend Name]
    EnterName --> Step2[Step 2: Choose Friend]
    
    Step2 --> SearchMethod{Search Method}
    SearchMethod -->|Username| SearchUser[Search by Username]
    SearchMethod -->|Share Link| GenerateLink[Generate Invite Link]
    SearchMethod -->|Recent| ShowRecent[Show Recent Friends]
    
    SearchUser --> SelectFriend[Select Friend]
    ShowRecent --> SelectFriend
    GenerateLink --> SendLink[Send Link to Friend]
    
    SelectFriend --> CheckFriend{Friend Has Account?}
    CheckFriend -->|No| InviteFlow[Generate Invite Link]
    CheckFriend -->|Yes| Step3[Step 3: Blend Settings]
    
    InviteFlow --> WaitForJoin[Show Pending State]
    
    Step3 --> ConfigureSettings[Configure Blend Options]
    ConfigureSettings --> TrackCount[Set Track Count: 20-100]
    TrackCount --> TimeRange[Select Time Range]
    TimeRange --> Preview[Show Preview]
    
    Preview --> Confirm[Click Create]
    Confirm --> Processing[Processing Animation]
    
    Processing --> FetchTracks1[Fetch User 1 Tracks]
    Processing --> FetchTracks2[Fetch User 2 Tracks]
    
    FetchTracks1 --> BlendAlgorithm[Run Blend Algorithm]
    FetchTracks2 --> BlendAlgorithm
    
    BlendAlgorithm --> SaveBlend[Save to Database]
    SaveBlend --> CreatePlaylist{Auto-Export?}
    
    CreatePlaylist -->|Yes| ExportBoth[Export to Both Providers]
    CreatePlaylist -->|No| ShowResults[Show Results Page]
    
    ExportBoth --> ShowResults
    ShowResults --> ShareOptions[Show Share Options]
```

### Join Blend Flow (Via Invite Link)

```mermaid
flowchart TD
    Start([Friend Receives Link]) --> ClickLink[Click Invite Link]
    ClickLink --> CheckAuth{Logged In?}
    
    CheckAuth -->|No| Landing[Show Landing + Join Banner]
    CheckAuth -->|Yes| JoinPage[Show Join Blend Page]
    
    Landing --> ConnectProvider[Connect Provider to Join]
    ConnectProvider --> AuthFlow[OAuth Flow]
    AuthFlow --> JoinPage
    
    JoinPage --> ShowPreview[Show Blend Preview]
    ShowPreview --> ShowCreator[Show Creator Info]
    ShowCreator --> AcceptInvite{Accept Invite?}
    
    AcceptInvite -->|Yes| JoinBlend[Join Blend]
    AcceptInvite -->|No| DeclineBlend[Decline & Return]
    
    JoinBlend --> ProcessBlend[Process Blend]
    ProcessBlend --> NotifyCreator[Notify Creator]
    NotifyCreator --> RedirectResults[Show Blend Results]
    
    DeclineBlend --> Dashboard[Return to Dashboard]
```

## 3. Edge Cases & Error States

### Token Expiration Handling

```mermaid
flowchart TD
    Start([API Call]) --> CheckToken{Token Valid?}
    CheckToken -->|Yes| MakeRequest[Continue Request]
    CheckToken -->|No| CheckProvider{Which Provider?}
    
    CheckProvider -->|Spotify| RefreshSpotify[Refresh Spotify Token]
    CheckProvider -->|Apple| AppleExpired[Apple Token Expired]
    
    RefreshSpotify --> Success{Refresh Success?}
    Success -->|Yes| UpdateToken[Update Stored Token]
    Success -->|No| ReauthNeeded[Mark Connection Invalid]
    
    AppleExpired --> Show6MonthError[Show Re-auth Required]
    Show6MonthError --> RemoveConnection[Remove Apple Connection]
    RemoveConnection --> PromptReconnect[Prompt Reconnect]
    
    UpdateToken --> RetryRequest[Retry Original Request]
    RetryRequest --> MakeRequest
    
    ReauthNeeded --> ShowReconnect[Show Reconnect Banner]
    PromptReconnect --> UserAction{User Action}
    ShowReconnect --> UserAction
    
    UserAction -->|Reconnect| StartAuth[Start Auth Flow]
    UserAction -->|Dismiss| ContinueDegraded[Continue Without Provider]
```

### Provider Mismatch

```mermaid
flowchart TD
    Start([Create Blend]) --> CheckUsers[Check Both Users]
    CheckUsers --> CompareProviders{Same Provider?}
    
    CompareProviders -->|Yes| StandardBlend[Continue Normal Blend]
    CompareProviders -->|No| CrossPlatform[Cross-Platform Blend]
    
    CrossPlatform --> CheckISRC{Tracks Have ISRC?}
    CheckISRC -->|Most Yes| ISRCMatch[Match by ISRC]
    CheckISRC -->|Most No| FuzzyMatch[Fuzzy Match Algorithm]
    
    ISRCMatch --> CreateUnified[Create Unified Playlist]
    FuzzyMatch --> CreateUnified
    
    CreateUnified --> ExportDecision{Export Where?}
    ExportDecision --> UserChoice[Let User Choose]
    
    UserChoice -->|User 1 Provider| ExportProvider1[Export to Provider 1]
    UserChoice -->|User 2 Provider| ExportProvider2[Export to Provider 2]
    UserChoice -->|Both| TryBoth[Attempt Both Exports]
    
    TryBoth --> CheckTracks[Check Track Availability]
    CheckTracks --> PartialExport[Export Available Tracks]
    PartialExport --> ShowWarning[Show Unavailable Tracks Warning]
```

### Network & API Failures

```mermaid
flowchart TD
    Start([User Action]) --> APICall[Make API Request]
    APICall --> CheckResponse{Response OK?}
    
    CheckResponse -->|Yes| Success[Continue Flow]
    CheckResponse -->|No| ErrorType{Error Type?}
    
    ErrorType -->|Network| NetworkError[Connection Error]
    ErrorType -->|429| RateLimit[Rate Limited]
    ErrorType -->|401| AuthError[Auth Failed]
    ErrorType -->|500| ServerError[Server Error]
    
    NetworkError --> ShowOffline[Show Offline Banner]
    ShowOffline --> Retryable[Enable Retry Button]
    
    RateLimit --> CheckRetryAfter{Has Retry-After?}
    CheckRetryAfter -->|Yes| WaitPeriod[Wait & Auto-Retry]
    CheckRetryAfter -->|No| Backoff[Exponential Backoff]
    
    AuthError --> ClearSession[Clear Session]
    ClearSession --> RedirectLogin[Redirect to Login]
    
    ServerError --> LogError[Log to Monitoring]
    LogError --> ShowGeneric[Show Generic Error]
    ShowGeneric --> SuggestRetry[Suggest Retry Later]
    
    Retryable --> UserRetry{User Retries?}
    UserRetry -->|Yes| APICall
    UserRetry -->|No| Abandon[Abandon Action]
    
    WaitPeriod --> AutoRetry[Auto Retry]
    Backoff --> AutoRetry
    AutoRetry --> APICall
```

## 4. Share & Discovery Flow

### Public Blend Sharing

```mermaid
flowchart TD
    Start([Blend Results Page]) --> ShareButton[Click Share]
    ShareButton --> ShareModal[Open Share Modal]
    
    ShareModal --> ShareOptions{Share Method}
    ShareOptions -->|Copy Link| CopyLink[Copy to Clipboard]
    ShareOptions -->|QR Code| ShowQR[Display QR Code]
    ShareOptions -->|Social| SocialShare[Share to Social]
    
    CopyLink --> ShowToast[Toast: Link Copied]
    ShowQR --> QRModal[QR Code Modal]
    SocialShare --> Platform{Choose Platform}
    
    Platform -->|Twitter| TwitterShare[Open Twitter Share]
    Platform -->|Instagram| IGStory[Create IG Story Template]
    Platform -->|WhatsApp| WhatsApp[Open WhatsApp Share]
    
    Public([Public User]) --> ClickShare[Click Shared Link]
    ClickShare --> LoadBlend[Load Public Blend View]
    
    LoadBlend --> ShowPublic[Show Track List]
    ShowPublic --> ShowParticipants[Show Participants]
    ShowParticipants --> ShowCTA[Show Join CTA]
    
    ShowCTA --> UserAction{User Action}
    UserAction -->|Create Own| SignupFlow[Start Signup]
    UserAction -->|Listen| OpenProvider[Open in Music App]
    UserAction -->|Close| Exit[Leave Page]
    
    OpenProvider --> DetectPlatform{Detect Platform}
    DetectPlatform -->|iOS + Apple| OpenAppleMusic[Open Apple Music]
    DetectPlatform -->|Has Spotify| OpenSpotify[Open Spotify]
    DetectPlatform -->|Neither| ShowOptions[Show App Options]
```

## 5. Data Sync & Refresh Flow

### Manual Refresh

```mermaid
flowchart TD
    Start([Dashboard]) --> RefreshButton[Click Refresh]
    RefreshButton --> CheckLastSync{Last Sync Time}
    
    CheckLastSync -->|< 1 hour| ShowMessage[Too Soon Message]
    CheckLastSync -->|> 1 hour| StartSync[Start Sync]
    
    ShowMessage --> Exit[No Action]
    
    StartSync --> ShowProgress[Show Progress Bar]
    ShowProgress --> FetchProviders[Fetch All Providers]
    
    FetchProviders --> Parallel{Parallel Fetch}
    Parallel --> FetchSpotify[Fetch Spotify Tracks]
    Parallel --> FetchApple[Fetch Apple Tracks]
    
    FetchSpotify --> ProcessSpotify[Process & Dedupe]
    FetchApple --> ProcessApple[Process & Dedupe]
    
    ProcessSpotify --> UpdateDB1[Update Database]
    ProcessApple --> UpdateDB2[Update Database]
    
    UpdateDB1 --> CheckComplete{Both Complete?}
    UpdateDB2 --> CheckComplete
    
    CheckComplete -->|No| Wait[Wait for Both]
    CheckComplete -->|Yes| UpdateUI[Refresh UI]
    
    Wait --> CheckComplete
    UpdateUI --> ShowSuccess[Success Toast]
    ShowSuccess --> UpdateTimestamp[Update Last Sync]
```

### Background Auto-Sync

```mermaid
flowchart TD
    Start([Page Load]) --> CheckSync{Last Sync > 24h?}
    CheckSync -->|No| NoAction[No Sync Needed]
    CheckSync -->|Yes| QueueSync[Queue Background Sync]
    
    QueueSync --> BackgroundWorker[Background Worker]
    BackgroundWorker --> CheckTokens[Validate Tokens]
    
    CheckTokens --> TokensValid{All Valid?}
    TokensValid -->|No| SkipProvider[Skip Invalid Provider]
    TokensValid -->|Yes| FetchData[Fetch Latest Data]
    
    FetchData --> CompareData{Data Changed?}
    CompareData -->|No| UpdateTimestamp[Update Sync Time Only]
    CompareData -->|Yes| UpdateData[Update Track Data]
    
    UpdateData --> CheckBlends{Active Blends?}
    CheckBlends -->|Yes| RecalcBlends[Recalculate Blends]
    CheckBlends -->|No| UpdateTimestamp
    
    RecalcBlends --> NotifyUsers[Queue Notifications]
    NotifyUsers --> UpdateTimestamp
```

## Key UX Principles

1. **Progressive Disclosure**: Don't overwhelm new users, reveal features gradually
2. **Optimistic UI**: Show success states immediately, handle errors gracefully
3. **Clear Feedback**: Every action has immediate visual feedback
4. **Smart Defaults**: Pre-select sensible options (medium-term tracks, 50 songs)
5. **Forgiving Actions**: Allow undo/edit for non-destructive operations
6. **Accessible States**: Clear loading, error, empty, and success states
7. **Mobile-First**: Touch-friendly targets, swipe gestures where appropriate
8. **Performance Perception**: Show skeletons, progressive loading, instant interactions