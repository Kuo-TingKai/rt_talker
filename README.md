# Real-Time AI Voice Conversation Starter

A minimal web application that enables real-time voice conversations using LiveKit and OpenAI Realtime API. This project demonstrates integration of real-time communication, modern web frameworks, and AI features.

## Features

- 🎤 Real-time voice conversation using LiveKit
- 🤖 AI-powered responses using OpenAI Realtime API
- 📱 Clean, modern UI with connection status indicators
- 🔄 Real-time transcription and AI response display
- 🎯 TypeScript for type safety
- ⚡ Next.js 14 with App Router

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Node.js, Express
- **Real-time Communication**: LiveKit SDK
- **AI Service**: OpenAI Realtime API
- **Styling**: CSS-in-JS (styled-jsx)

## Prerequisites

- Node.js 18+ and npm/yarn
- LiveKit account (free tier available at [livekit.io](https://livekit.io))
- OpenAI API key with access to Realtime API

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rt_talker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key

# Server Configuration
PORT=3001
```

**Getting LiveKit Credentials:**
1. Sign up for a free account at [livekit.io](https://livekit.io)
2. Create a new project
3. Copy the WebSocket URL, API Key, and API Secret from your project settings

**Getting OpenAI API Key:**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new API key
4. Ensure you have access to the Realtime API (may require waitlist)

### 4. Run the Application

**Terminal 1 - Start the Backend Server:**
```bash
npm run server
```

The backend server will run on `http://localhost:3001`

**Terminal 2 - Start the Frontend:**
```bash
npm run dev
```

The frontend will run on `http://localhost:3003`

### 5. Open in Browser

Navigate to `http://localhost:3003` in your browser.

## How to Use

1. **Start Conversation**: Click the "Start Conversation" button
2. **Grant Permissions**: Allow microphone access when prompted
3. **Speak**: The application will capture your voice and process it with AI
4. **View Results**: See your transcription and AI responses in real-time
5. **End Conversation**: Click "End Conversation" to disconnect

## Project Structure

```
rt_talker/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── VoiceConversation.tsx    # Main conversation component
│   ├── ConnectionStatus.tsx     # Connection status indicator
│   ├── ConversationControls.tsx # Start/End buttons
│   └── MicrophoneStatus.tsx     # Microphone status indicator
├── hooks/                 # Custom React hooks
│   └── useOpenAIRealtime.ts    # OpenAI Realtime API integration
├── server/               # Backend server
│   └── index.js          # Express server for token generation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Architecture Decisions

### Frontend Architecture
- **Next.js App Router**: Using the latest Next.js 14 App Router for better performance and developer experience
- **Client Components**: All interactive components are marked as 'use client' for React Server Components compatibility
- **Custom Hooks**: Separated AI integration logic into a reusable hook for better code organization

### Backend Architecture
- **Express Server**: Simple Express server for token generation and API endpoints
- **Token-based Authentication**: Using LiveKit's access token system for secure room access
- **Error Handling**: Comprehensive error handling with user-friendly error messages

### Real-time Communication
- **LiveKit SDK**: Chosen for its robust WebRTC implementation and ease of use
- **Room-based Architecture**: Using LiveKit rooms for managing participants and audio streams
- **Adaptive Streaming**: Enabled adaptive streaming for better performance

### AI Integration
- **OpenAI Realtime API**: Using OpenAI's Realtime API for voice-to-voice conversation
- **WebSocket Connection**: Maintaining persistent WebSocket connection for real-time audio processing
- **PCM16 Audio Format**: Using PCM16 format for audio encoding/decoding

## Troubleshooting

### Microphone Not Working
- Ensure you've granted microphone permissions in your browser
- Check browser console for permission errors
- Try refreshing the page and granting permissions again

### Connection Issues
- Verify your LiveKit credentials are correct in `.env`
- Check that the backend server is running on port 3001
- Ensure your LiveKit server URL is accessible

### AI Not Responding
- Verify your OpenAI API key is set correctly
- Check that you have access to the Realtime API
- Review browser console for API errors

### Port Already in Use
- Change the `PORT` in `.env` if 3001 is already in use
- Update the frontend API calls if you change the backend port

## Development Notes

- The application uses LiveKit's free tier for development
- OpenAI Realtime API may require waitlist access
- For production, consider implementing proper error boundaries and loading states
- Audio processing happens client-side; consider server-side processing for production

## License

This project is created for a take-home assignment.

## Contact

For questions or issues, please refer to the project repository.

