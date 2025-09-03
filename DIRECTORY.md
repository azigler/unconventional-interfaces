# Project Directory Structure

This document outlines the organization of the Marble Tilt project.

## Client (React + Vite)

```
src/client/
├── components/        # Reusable UI components
│   ├── Marble/        # Marble component with physics
│   ├── GameBoard/     # Game board and obstacles
│   ├── Controls/      # User controls and inputs
│   └── UI/            # Game UI elements
│
├── hooks/             # Custom React hooks
│   ├── useDeviceOrientation.ts  # Device tilt hook
│   ├── useWebSocket.ts          # WebSocket communication
│   ├── useGamePhysics.ts        # Physics calculations
│   └── useCollisionDetection.ts # Collision detection
│
├── contexts/          # React contexts for state management
│   ├── GameContext.tsx      # Game state context
│   ├── WebSocketContext.tsx # WebSocket connection context
│   └── OrientationContext.tsx # Device orientation context
│
├── views/             # Main view components
│   ├── LobbyView.tsx  # LOBBY view showing all marbles
│   ├── LocalView.tsx  # LOCAL view for individual players
│   ├── HomeView.tsx   # Welcome screen and game setup
│   └── SettingsView.tsx # Game settings
│
├── utils/             # Utility functions
│   ├── physics.ts     # Physics calculation utilities
│   ├── networking.ts  # Network communication utilities
│   └── game.ts        # Game logic utilities
│
├── assets/            # Static assets
│   ├── images/        # Game images and sprites
│   ├── sounds/        # Game sound effects
│   └── models/        # 3D models if used
│
├── styles/            # CSS/SCSS styles
│   ├── global.css     # Global styles
│   └── components/    # Component-specific styles
│
└── App.tsx            # Main application component
```

## Server (Node.js)

```
src/server/
├── controllers/       # Request handlers
│   ├── gameController.ts  # Game state management
│   ├── playerController.ts # Player management
│   └── websocketController.ts # WebSocket event handling
│
├── models/            # Data models
│   ├── Player.ts      # Player data structure
│   ├── GameState.ts   # Game state structure
│   └── GameWorld.ts   # Game world configuration
│
├── utils/             # Utility functions
│   ├── physics.ts     # Server-side physics calculations
│   ├── logging.ts     # Logging utilities
│   └── validation.ts  # Input validation
│
├── config/            # Server configuration
│   ├── default.ts     # Default configuration
│   └── production.ts  # Production overrides
│
├── middleware/        # Express middleware
│   ├── auth.ts        # Authentication if needed
│   └── errorHandler.ts # Error handling
│
└── server.ts          # Main server entry point
```

## Configuration and Documentation

```
/
├── certs/             # SSL certificates for HTTPS
│   ├── cert.pem       # Certificate file
│   └── key.pem        # Private key file
│
├── docs/              # Documentation
│   ├── api.md         # API documentation
│   ├── setup.md       # Setup instructions
│   └── gameplay.md    # Gameplay instructions
│
├── .env               # Environment variables
├── .gitignore         # Git ignore file
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
├── README.md          # Project overview
└── SPEC.md            # Detailed specification
```

## Getting Started

To set up the development environment:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate SSL certificates for HTTPS (required for device orientation API):
   ```bash
   # Install mkcert
   brew install mkcert
   mkcert -install
   
   # Create certificates in the certs directory
   mkdir -p certs
   cd certs
   mkcert localhost
   mv localhost.pem cert.pem
   mv localhost-key.pem key.pem
   ```

3. Start the development server:
   ```bash
   # Start the client (React + Vite)
   npm run dev
   
   # In another terminal, start the server
   npm run server
   ```

4. Access the game:
   - LOBBY view: `https://localhost:3000/lobby`
   - LOCAL view: `https://localhost:3000/local` (access from mobile device on same network)
