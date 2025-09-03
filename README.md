# Marble Tilt: Multiplayer Marble Game

A multiplayer marble game using phone tilt controls as an unconventional interface, developed for the Unconventional Interfaces Hackathon.

## Project Overview

Marble Tilt is a multiplayer game where players control marbles by physically tilting their phones. The game leverages the device orientation API to translate physical movement into marble movement in the game world.

Players join a shared game environment where their marbles can interact with obstacles, collectibles, and other players' marbles. The game features:

- **Unconventional Interface**: Control your marble by tilting your phone
- **Multiplayer Experience**: Play with friends in a shared game world
- **Dual View System**: 
  - **LOBBY View**: A global view showing all marbles (for tablets/desktops)
  - **LOCAL View**: A player-centered view on each phone

## Technology Stack

- **Frontend**: React + Vite with TypeScript
- **Backend**: Node.js with Express and WebSockets
- **Key APIs**: Device Orientation API, WebSockets, Canvas
- **Development**: HTTPS local development (required for device orientation API)

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- mkcert (for local SSL certificates)

### Setup

1. Run the setup script to initialize the project:

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

2. Start the development server:

```bash
# Install all dependencies
npm run install-all

# Start both client and server
npm run dev
```

3. Access the application:
   - Client: `https://localhost:3000`
   - Server: `https://localhost:3001`

For mobile testing, use your computer's local IP address instead of localhost.

## Project Structure

```
/
├── marble-tilt/         # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── contexts/    # React contexts
│   │   ├── views/       # Main view components
│   │   └── utils/       # Utility functions
│   └── ...
│
├── server/              # Backend (Node.js)
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Data models
│   │   └── utils/       # Utility functions
│   └── ...
│
├── certs/               # SSL certificates for HTTPS
├── subagents/           # Goose subagent recipes
├── SPEC.md              # Detailed specification
├── SETUP.md             # Setup guide
├── SUBAGENTS.md         # Subagent implementation plan
└── README.md            # This file
```

## Goose Subagent Implementation

This project uses [Goose subagents](https://block.github.io/goose/docs/experimental/subagents) to parallelize development tasks. Each subagent specializes in a specific aspect of the game:

1. **Infrastructure Subagent**: Project setup and deployment
2. **Physics Subagent**: Marble physics and collision detection
3. **Device Orientation Subagent**: Tilt controls implementation
4. **Multiplayer Networking Subagent**: Real-time multiplayer functionality
5. **UI/UX Subagent**: Game interface and visual design
6. **Testing Subagent**: Cross-device testing and optimization

See `SUBAGENTS.md` for detailed information on the subagent architecture.

## Development Notes

- **HTTPS Requirement**: The Device Orientation API requires HTTPS, even for local development
- **iOS Permission**: iOS 13+ requires explicit permission to access device orientation data
- **Responsive Design**: The game adapts to different screen sizes, with specific views for mobile and larger screens

## Documentation

- [SPEC.md](SPEC.md) - Detailed project specification
- [SETUP.md](SETUP.md) - Complete setup and development guide
- [SUBAGENTS.md](SUBAGENTS.md) - Goose subagent implementation plan
- [DIRECTORY.md](DIRECTORY.md) - Project directory structure explanation

## License

MIT
