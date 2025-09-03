# Multiplayer Marble Tilt

This part of the project implements a multiplayer marble game where each connected device controls a marble in a shared world using device orientation (tilt) controls.

## Features

- **Device Orientation Controls**: Tilt your phone to control your marble
- **Multiplayer Experience**: Each connected device adds a marble to the shared world
- **Real-time Synchronization**: Marble positions are synchronized across all clients
- **Dual View System**:
  - **LOBBY View**: Global view showing all marbles (ideal for tablets/desktops)
  - **LOCAL View**: Control interface for individual players (ideal for phones)

## Implementation Details

### Frontend Components

- **Device Orientation Hook**: Custom React hook to access device orientation data
- **OrientationControls**: Component to handle device tilt and provide user controls
- **MarbleWorld**: Component to display all marbles in the shared world
- **WebSocketContext**: Context for WebSocket communication
- **GameContext**: Context for game state management

### Backend Components

- **WebSocket Server**: Handles real-time communication between clients
- **Game State Management**: Tracks marble positions and player information
- **Position Updates**: Processes and broadcasts position updates to all clients

## How to Use

1. Start both the client and server:
   ```
   npm run dev
   ```

2. Open the application:
   - On a desktop/tablet: Navigate to `https://localhost:3000/lobby` to see all marbles
   - On mobile devices: Navigate to `https://your-local-ip:3000/local` to control your marble

3. For testing, you can use the orientation demo at `https://localhost:3000/demo`

## Technical Notes

- **HTTPS Required**: Device orientation API requires HTTPS, even for local development
- **iOS Permission**: iOS 13+ requires explicit permission to access device orientation data
- **Calibration**: The orientation controls include calibration to accommodate different holding positions

## Directory Structure

```
/
├── client/                # Frontend code
│   ├── components/        # React components
│   │   ├── Controls/      # User control components
│   │   └── MarbleWorld/   # Marble display components
│   ├── contexts/          # React contexts
│   │   ├── GameContext.tsx       # Game state management
│   │   └── WebSocketContext.tsx  # WebSocket communication
│   ├── hooks/             # Custom React hooks
│   │   └── useDeviceOrientation.ts  # Device orientation hook
│   ├── utils/             # Utility functions
│   │   └── orientation.ts  # Orientation utility functions
│   └── views/             # Main view components
│       ├── HomeView.tsx   # Landing page
│       ├── LocalView.tsx  # Mobile control view
│       └── LobbyView.tsx  # Shared world view
│
└── server/                # Backend code
    └── src/
        └── server.ts      # WebSocket server implementation
```
