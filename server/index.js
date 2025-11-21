const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables validation
const requiredEnvVars = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please set them in your .env file');
}

/**
 * Generate LiveKit access token for a participant
 * POST /api/token
 * Body: { roomName: string, participantName: string }
 */
app.post('/api/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    // Validate input
    if (!roomName || !participantName) {
      return res.status(400).json({
        error: 'Missing required fields: roomName and participantName are required',
      });
    }

    // Check if environment variables are set
    if (missingVars.length > 0) {
      return res.status(500).json({
        error: 'Server configuration error: Missing LiveKit credentials',
        details: `Please set: ${missingVars.join(', ')}`,
      });
    }

    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    // Return token and connection details
    res.json({
      token,
      url: livekitUrl,
      roomName,
      participantName,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate access token',
      details: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * WebSocket Server for proxying OpenAI Realtime API
 * This allows the browser to connect to OpenAI Realtime API through the backend
 */
const wss = new WebSocketServer({ 
  server,
  path: '/api/openai-realtime'
});

wss.on('connection', (clientWs, req) => {
  console.log('Client connected to OpenAI Realtime proxy');
  
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    clientWs.close(1011, 'OpenAI API key not configured');
    return;
  }

  // Connect to OpenAI Realtime API
  const openaiWsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  console.log('🔗 Backend: Connecting to OpenAI Realtime API...');
  console.log('🔗 Backend: URL:', openaiWsUrl);
  console.log('🔗 Backend: API Key:', apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT SET');
  
  const openaiWs = new (require('ws'))(openaiWsUrl, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  // Forward messages from client to OpenAI
  clientWs.on('message', (data) => {
    if (openaiWs.readyState === openaiWs.OPEN) {
      // Ensure data is sent as-is (could be string or Buffer)
      openaiWs.send(data);
    }
  });

  // Forward messages from OpenAI to client
  openaiWs.on('message', (data) => {
    if (clientWs.readyState === clientWs.OPEN) {
      // OpenAI sends messages as strings (JSON), forward as-is
      // If it's a Buffer, convert to string first
      if (Buffer.isBuffer(data)) {
        clientWs.send(data.toString('utf8'));
      } else {
        clientWs.send(data);
      }
    }
  });

  // Handle OpenAI connection events
  openaiWs.on('open', () => {
    console.log('✅ Backend: Connected to OpenAI Realtime API');
  });

  openaiWs.on('error', (error) => {
    console.error('❌ Backend: OpenAI WebSocket error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.close(1011, 'OpenAI connection error');
    }
  });

  openaiWs.on('close', (code, reason) => {
    console.log(`⚠️ Backend: OpenAI WebSocket closed: ${code} - ${reason.toString()}`);
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.close(code, reason);
    }
  });

  // Log messages from OpenAI for debugging
  openaiWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'error') {
        console.error('❌ Backend: OpenAI error:', JSON.stringify(message, null, 2));
      } else if (message.type === 'session.created' || message.type === 'session.updated') {
        console.log(`✅ Backend: ${message.type}`);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  });

  // Handle client disconnection
  clientWs.on('close', () => {
    console.log('Client disconnected from OpenAI Realtime proxy');
    if (openaiWs.readyState === openaiWs.OPEN || openaiWs.readyState === openaiWs.CONNECTING) {
      openaiWs.close();
    }
  });

  clientWs.on('error', (error) => {
    console.error('Client WebSocket error:', error);
    if (openaiWs.readyState === openaiWs.OPEN || openaiWs.readyState === openaiWs.CONNECTING) {
      openaiWs.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket proxy available at ws://localhost:${PORT}/api/openai-realtime`);
  console.log(`LiveKit URL: ${process.env.LIVEKIT_URL || 'Not set'}`);
  console.log(`OpenAI API Key: ${process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Set' : 'Not set'}`);
});

