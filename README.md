# Queue Star 🎵

> AI-powered music blending platform that creates perfect playlists by intelligently combining music tastes between friends.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎧 Music Service Integration
- **Spotify OAuth**: Complete authentication flow with comprehensive data synchronization
- **Apple Music OAuth**: MusicKit JS integration for seamless Apple Music access
- **Real-time Sync**: Background synchronization of music libraries, playlists, and listening history
- **Multi-provider Support**: Users can link both Spotify and Apple Music accounts

### 🤖 AI-Powered Blending
- **GPT-4 Integration**: Intelligent playlist curation using OpenAI's latest models
- **Smart Mixing**: 55-track playlists that perfectly balance all participants' music tastes
- **Genre Balancing**: Automatic tempo and energy progression for optimal listening flow
- **Personalized Recommendations**: AI considers listening history, top tracks, and music preferences

### 👥 Social Features
- **Friend System**: Add friends via search or unique invite links
- **Collaborative Blends**: Create playlists with multiple friends
- **Participant Tracking**: See who contributed which songs to the blend
- **Share Functionality**: Easy sharing of created blends

### 🎨 User Experience
- **Apple Music-style UI**: Beautiful, modern interface inspired by Apple Music
- **Responsive Design**: Mobile-first approach with full desktop support
- **Dark/Light Mode**: Automatic theme detection based on system preferences
- **Real-time Updates**: Live progress tracking during blend generation

### 📤 Export Capabilities
- **Apple Music Export**: Direct playlist creation in user's Apple Music library
- **Track Matching**: Intelligent matching of tracks across different music services
- **Playlist Metadata**: Preserve all track information including energy, tempo, and genre

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS + DaisyUI
- **State Management**: Zustand + React Query
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Authentication**: Custom JWT implementation

### Infrastructure
- **Hosting**: Vercel (serverless)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Music APIs**: Spotify Web API, Apple MusicKit JS

### AI & Machine Learning
- **LLM Provider**: OpenAI
- **Model**: GPT-4 Optimized
- **Context Management**: Custom token optimization

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js App    │────▶│  API Routes     │────▶│  PostgreSQL     │
│  (React SSR)    │     │  (Serverless)   │     │  (Supabase)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐     ┌─────────────────┐     
│                 │     │                 │     
│  Music APIs     │     │  OpenAI API     │     
│  (Spotify/Apple)│     │  (GPT-4)        │     
│                 │     │                 │     
└─────────────────┘     └─────────────────┘     
```

### Key Design Decisions

1. **Serverless Architecture**: Leverages Vercel's edge functions for scalability
2. **Connection Pooling**: Supabase pooler for efficient database connections
3. **Encrypted Storage**: All OAuth tokens encrypted at rest
4. **Append-only Design**: Historical data preservation for better AI recommendations
5. **Type Safety**: End-to-end TypeScript with Zod validation

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose (recommended)
- **OR** Node.js 18+ & PostgreSQL (manual setup)
- Spotify Developer Account
- Apple Developer Account (optional, for Apple Music features)
- OpenAI API key

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/vishk23/QueueStar-public.git
cd QueueStar-public
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
```

3. **Add your API keys to .env.local**
```env
# Required
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=sk-your_openai_api_key

# Optional (for Apple Music features)
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_base64_encoded_private_key
```

4. **Start development environment**
```bash
# Quick setup (recommended)
./scripts/docker-dev.sh

# Or manually
docker-compose up -d
npm install
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

### Option 2: Manual Setup

1. **Clone and install**
```bash
git clone https://github.com/vishk23/QueueStar-public.git
cd QueueStar-public
npm install
```

2. **Set up PostgreSQL**
```bash
# Create database
createdb queuestar_dev

# Run schema initialization
psql queuestar_dev < db/init/01-init-schema.sql
```

3. **Configure environment**
```bash
cp .env.example .env.local
# Edit DATABASE_URL to match your PostgreSQL setup
# Add your API keys
```

4. **Start development**
```bash
npm run dev
```

### Getting API Keys

#### Spotify (Required)
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/spotify/callback`
4. Copy Client ID and Client Secret

#### OpenAI (Required)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

#### Apple Music (Optional)
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Create a MusicKit identifier
3. Generate a private key (.p8 file)
4. Get your Team ID and Key ID
5. Base64 encode the private key content

## 📖 API Documentation

### Authentication Endpoints
```typescript
POST   /api/auth/signup         # User registration
POST   /api/auth/login          # User login
POST   /api/auth/logout         # User logout
GET    /api/auth/spotify        # Spotify OAuth initiation
GET    /api/auth/apple          # Apple Music OAuth initiation
```

### Blend Management
```typescript
POST   /api/blends/create       # Create new blend
GET    /api/blends/list         # List user's blends
GET    /api/blends/[id]/tracks  # Get blend tracks
POST   /api/blends/[id]/generate # Generate AI blend
POST   /api/blends/[id]/export-apple # Export to Apple Music
```

### Friend System
```typescript
GET    /api/friends/list        # List friends
POST   /api/friends/add         # Send friend request
DELETE /api/friends/remove      # Remove friend
GET    /api/friends/search      # Search users
POST   /api/invites/create      # Create invite link
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/queue-star)

1. Click the deploy button above
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Spotify for their comprehensive Web API
- Apple for MusicKit JS
- Vercel for hosting and serverless functions
- Supabase for database hosting
- The open-source community

## 📊 Project Stats

- **Lines of Code**: ~15,000
- **Components**: 50+
- **API Endpoints**: 25+
- **Database Tables**: 20+
- **Test Coverage**: 85%

## 🔗 Links

- [Live Demo](https://queuestar.vercel.app)
- [Documentation](./docs)
- [API Reference](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)

## 👤 Author

**Vishnu K**

- GitHub: [@vishk23](https://github.com/vishk23)
- LinkedIn: [Vishnu K](https://linkedin.com/in/vishnu-k-chittibhoina)
- Portfolio: [Coming Soon]()

## 🌟 Show your support

Give a ⭐️ if you like this project!

---

<p align="center">Made with ❤️ and lots of ☕</p>