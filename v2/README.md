# Marble Tilt V2: Optimized Multiplayer Marble Game

This is the V2 implementation of the Marble Tilt game, focusing on performance optimization, better frontend-backend integration, and a streamlined architecture.

## Implementation Status

The V2 project has been set up with a comprehensive structure and core functionality:

- ✅ Project structure established with client/server/shared architecture
- ✅ React + TypeScript frontend with Vite for fast development
- ✅ Firebase integration for real-time data
- ✅ Optimized device orientation controls with smoothing and calibration
- ✅ Component-based UI architecture with clean separation of concerns
- ✅ Node.js + Express backend with Socket.IO for real-time communication
- ✅ Shared types and interfaces between client and server

## Project Goals

The V2 implementation addresses several issues in the original version:

1. **Performance Optimization** - Reducing lag and rendering issues through:
   - Throttled updates using requestAnimationFrame
   - Optimized rendering with React best practices
   - Efficient state management

2. **Firestore Integration** - Improving communication between frontend and backend:
   - Real-time data synchronization
   - Proper error handling and offline support
   - Better data structure with game rooms and players

3. **Unified Architecture** - Consolidating disparate parts into a cohesive application:
   - Shared type definitions
   - Consistent state management
   - Clear component hierarchy

4. **Code Organization** - Better structure for maintainability and scalability:
   - Separation of concerns (components, hooks, contexts)
   - Consistent naming conventions
   - Comprehensive documentation

## Architecture Overview

The V2 project uses a monorepo approach with a clear separation between client and server:

```
/v2
├── src/
│   ├── client/              # Frontend code
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React contexts
│   │   ├── views/           # Main view components 
│   │   ├── utils/           # Utility functions
│   │   └── firebase/        # Firebase integration
│   │
│   ├── server/              # Backend code
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Data models
│   │   └── utils/           # Utility functions
│   │
│   └── shared/              # Shared code between client and server
│       ├── types/           # TypeScript interfaces and types
│       └── constants/       # Shared constants
│
├── public/                  # Static assets
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Key Improvements

### 1. Performance Optimization

- **Efficient Rendering** - Using React's optimized rendering approaches
- **Animation Frames** - Using requestAnimationFrame for smoother animations
- **Throttled Updates** - Limiting state updates to prevent excessive renders
- **Optimized Physics** - Better physics simulation with reduced calculations

### 2. Firestore Integration

- **Real-time Sync** - Improved integration with Firestore for real-time game state
- **Game Rooms** - Better organization with room-based multiplayer
- **Player Management** - Improved player state handling and connection tracking
- **Data Structure** - Optimized Firestore collections and documents

### 3. Device Orientation

- **Enhanced Controls** - Improved tilt controls with calibration and sensitivity adjustments
- **Smoothing Algorithm** - Added smoothing to reduce jittery movement
- **Permission Handling** - Better handling of device orientation permissions
- **Fallback Support** - Graceful degradation for unsupported devices

### 4. Multiplayer Experience

- **Lobby System** - Enhanced player management and game lobbies
- **Spectator Mode** - Dedicated view for spectating games
- **Game Rooms** - Multiple concurrent game rooms
- **Store System** - In-game store with items and cart functionality

## Next Steps

1. **Complete the Backend Implementation**:
   - Implement game logic controllers
   - Add user authentication
   - Set up more advanced game mechanics

2. **Enhance the Frontend**:
   - Add more visual polish and animations
   - Implement additional game features
   - Create proper marble assets and visuals

3. **Testing and Optimization**:
   - Cross-device testing
   - Performance profiling
   - Load testing for multiplayer

4. **Deployment**:
   - Set up CI/CD pipeline
   - Configure production environment
   - Implement monitoring and analytics

## Development

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Firebase account for Firestore
- HTTPS certificates for local development (mkcert)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up HTTPS certificates (required for device orientation):
```bash
npm run setup-certs
```

3. Start development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Firebase Setup

1. Create a Firebase project
2. Enable Firestore
3. Update the Firebase configuration in `src/client/firebase/config.ts`
4. Deploy Firestore security rules:
```bash
npm run deploy-rules
```

## License

MIT
