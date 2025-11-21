# Quick Start Guide

Get up and running with the Real-Time AI Voice Conversation app in 5 minutes.

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] LiveKit account (free tier available)
- [ ] OpenAI API key with Realtime API access

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
PORT=3001
```

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions on obtaining these credentials.

### 3. Start the Backend Server

Open Terminal 1:

```bash
npm run server
```

You should see:
```
Server running on http://localhost:3001
```

### 4. Start the Frontend

Open Terminal 2:

```bash
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3003
```

### 5. Open in Browser

Navigate to: `http://localhost:3003`

### 6. Start a Conversation

1. Click "Start Conversation"
2. Allow microphone access when prompted
3. Speak into your microphone
4. See your transcription and AI responses appear in real-time
5. Click "End Conversation" when done

## Troubleshooting

### "Failed to get access token"
- Check that the backend server is running on port 3001
- Verify your LiveKit credentials in `.env`
- Check the backend terminal for error messages

### "Microphone not working"
- Check browser permissions (click the lock icon in address bar)
- Try refreshing the page
- Check browser console for errors

### "OpenAI API key not found"
- Ensure `NEXT_PUBLIC_OPENAI_API_KEY` is set in `.env`
- Restart the frontend server after adding the variable
- Check that the variable name has the `NEXT_PUBLIC_` prefix

### Port Already in Use
- Change `PORT=3001` to a different port in `.env`
- Update the frontend API URL if you change the backend port

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [AI_PROMPTS.md](./AI_PROMPTS.md) to see how AI tools were used
- Review the code structure in `components/` and `hooks/`

## Need Help?

- Check the browser console for errors
- Review server logs in the backend terminal
- See [README.md](./README.md) for architecture details and troubleshooting

