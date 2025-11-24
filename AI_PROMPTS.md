# AI Tool Usage Documentation

This document describes the AI tools used during the development of this project and the key prompts that helped accomplish various tasks.

## AI Tools Used

- **Claude (Sonnet 4.5)**: Primary AI assistant used for code generation, architecture decisions, and problem-solving throughout the project

## Key Prompts and Their Impact

### 1. Initial Project Setup and Structure

**Prompt:**
```
Build this project based on the take-home programming interview assignment description

[Full project requirements provided]
```

**What it accomplished:**
- Generated the complete project structure with Next.js, TypeScript, and Express backend
- Created all necessary configuration files (package.json, tsconfig.json, next.config.js)
- Established the foundation for both frontend and backend components
- Set up proper TypeScript configuration and ESLint rules

**Why it worked well:**
- The prompt provided comprehensive requirements, allowing the AI to understand the full scope
- Clear specification of tech stack (Next.js, React, TypeScript, LiveKit, OpenAI) enabled accurate setup

---

### 2. LiveKit Integration and Audio Processing

**Prompt:**
```
Create backend service (Node.js/Express) for generating LiveKit tokens
Integrate LiveKit client SDK with audio processing
```

**What it accomplished:**
- Created Express server endpoint for generating LiveKit access tokens
- Implemented proper token generation with room permissions
- Set up LiveKit client-side integration with Room API
- Implemented microphone capture and audio streaming
- Added connection lifecycle management (connect/disconnect events)

**Why it worked well:**
- Specific technology requirements (LiveKit SDK) enabled accurate implementation
- The AI understood the token-based authentication pattern required by LiveKit

---

### 3. OpenAI Realtime API Integration

**Prompt:**
```
Integrate OpenAI Realtime API for AI voice conversation
```

**What it accomplished:**
- Created WebSocket connection to OpenAI Realtime API
- Implemented audio format conversion (PCM16)
- Set up message handling for transcription and AI responses
- Created custom React hook for managing AI conversation state

**Why it worked well:**
- The AI understood the WebSocket-based architecture of OpenAI Realtime API
- Properly implemented the event-driven message handling pattern

**Challenges encountered:**
- Initial implementation used a simplified placeholder approach
- Needed refinement to properly handle WebSocket connection lifecycle
- Audio format conversion required specific knowledge of PCM16 encoding

---

### 4. UI Component Development

**Prompt:**
```
Create frontend UI components (buttons, status indicators, etc.)
```

**What it accomplished:**
- Created reusable React components (ConnectionStatus, ConversationControls, MicrophoneStatus)
- Implemented clean, modern UI with CSS-in-JS styling
- Added visual feedback for connection states and microphone status
- Created responsive design with proper animations

**Why it worked well:**
- Clear component requirements enabled focused implementation
- The AI generated well-structured, reusable components

---

### 5. Error Handling and Edge Cases

**Prompt:**
```
Handle basic error cases
```

**What it accomplished:**
- Added comprehensive error handling in backend token generation
- Implemented environment variable validation
- Added user-friendly error messages in the frontend
- Created proper cleanup functions for WebSocket and LiveKit connections

**Why it worked well:**
- The AI understood the importance of graceful error handling
- Generated defensive code that checks for missing configuration

---

## Prompts That Didn't Work Well

### Attempted: Direct OpenAI Realtime API WebSocket Implementation

**Initial Prompt:**
```
How to integrate OpenAI Realtime API with WebSocket for voice conversation
```

**Why it didn't work initially:**
- The semantic search didn't find existing implementations in the codebase (as expected for a new project)
- The AI initially provided a simplified placeholder approach rather than a full WebSocket implementation
- Required multiple iterations to refine the implementation

**Solution:**
- Manually refined the implementation based on OpenAI Realtime API documentation patterns
- Created a more complete WebSocket connection handler with proper message parsing

---

## Development Workflow

1. **Initial Setup**: Used AI to generate project structure and configuration files
2. **Backend Development**: Generated Express server with LiveKit token endpoint
3. **Frontend Components**: Created React components with TypeScript
4. **Integration**: Connected LiveKit and OpenAI APIs
5. **Refinement**: Manually adjusted AI-generated code for production readiness

## Key Learnings

- **Specific Prompts Work Better**: Providing detailed requirements and tech stack information yields better results
- **Iterative Refinement**: Initial AI output often needs refinement for production use
- **Documentation Matters**: Clear documentation helps AI understand context better
- **Error Handling**: Always ask AI to include error handling and edge cases

---

### 6. Port Configuration and Server Management

**Prompt:**
```
Port 3000 is currently occupied by another service, please use a different port
```

**What it accomplished:**
- Changed frontend port from 3000 to 3003
- Updated port descriptions in all related files
- Fixed backend server port configuration issues

**Why it worked well:**
- Clear problem description allowed AI to quickly locate and fix the issue

---

### 7. LiveKit Credentials Setup

**Prompt:**
```
GUI shows disconnected, backend may need LiveKit credentials. Please tell me how to obtain LiveKit credentials
```

**What it accomplished:**
- Created detailed LiveKit credentials acquisition guide (`LIVEKIT_SETUP_GUIDE.md`)
- Provided step-by-step instructions
- Included common questions and answers

**Why it worked well:**
- User provided specific problem description, allowing AI to provide targeted solutions

---

### 8. OpenAI API Verification and Testing

**Prompt:**
```
I've updated the .env file. Please help me verify if the realtime API can be used now. Please help me execute:
- Restart the development server
- Test the application
```

**What it accomplished:**
- Created OpenAI API test script (`scripts/test-openai.js`)
- Verified API key validity
- Tested Realtime API connection
- Automated server startup process

**Why it worked well:**
- Clear task list allowed AI to systematically complete all steps

---

### 9. Microphone Activation Error Fix

**Prompt:**
```
Encountered the following error
[TypeError: Cannot read properties of undefined (reading 'values')]
```

**What it accomplished:**
- Fixed LiveKit audioTracks API usage
- Switched to correct `audioTrackPublications` API
- Added fallback mechanism (using getUserMedia)
- Improved error handling

**Why it worked well:**
- Specific error message allowed AI to quickly locate the issue
- Provided complete error context

---

### 10. WebSocket Proxy and Blob Handling

**Prompt:**
```
Still getting an error
[SyntaxError: Unexpected token 'o', "[object Blob]" is not valid JSON]
```

**What it accomplished:**
- Created backend WebSocket proxy server
- Handled browser's inability to set Authorization header
- Fixed Blob/ArrayBuffer to string conversion
- Improved message parsing logic

**Why it worked well:**
- Error message clearly indicated the problem type (Blob vs JSON)
- AI understood WebSocket limitations in browsers

---

### 11. Audio Processing and Result Display Optimization

**Prompt:**
```
Still no results from my speech
Is it because I closed the conversation too early after finishing recording, before the analysis results came out, causing the results not to be displayed?
```

**What it accomplished:**
- Improved audio processing timing (batch processing, every 1-2 seconds)
- Separated audio sending and response triggering logic
- Improved result saving logic when disconnecting
- Added UI update callback mechanism
- Improved error log display

**Why it worked well:**
- User provided good observation (closing too early may cause result loss)
- AI understood the problem and provided multi-faceted improvements

---

### 12. Session Ready Logic Improvement

**Prompt:**
```
Still getting an error several seconds after pressing start conversation
[server_error after session.created]
```

**What it accomplished:**
- Discovered that `session.created` already includes `audio` modality (even when only requesting `text`)
- Implemented check logic: if `session.created` already includes `audio`, skip Step 2
- Improved session ready marking timing: wait 2 seconds before marking as ready
- Added additional delay: wait another 500ms before processing pending audio
- Limited pending audio chunks: only send the last 2, discard old ones
- Increased delay between chunks: from 50ms to 200ms

**Why it worked well:**
- Log analysis revealed the key issue (session.created already includes audio)
- Systematically improved timing and sending strategy

**Challenges:**
- Even after improving timing, still receiving `server_error` when sending audio
- Need further investigation into audio format or API usage

---

### 13. Audio Sending Strategy Optimization

**Prompt:**
```
after pressing start conversation
[server_error when sending audio chunks]
```

**What it accomplished:**
- Limited the number of pending audio chunks sent at once (only keep the last 2)
- Increased delay between audio chunks (from 50ms to 200ms)
- Added additional delay before sending (200ms)
- Improved error handling: stop processing if sending fails

**Why it worked well:**
- Identified that sending too fast might be the cause
- Systematically slowed down sending speed

**Current Status:**
- Issue still persists, requires further investigation

---

## Current Status and Pending Issues

### Main Issue: OpenAI Realtime API server_error

**Problem Description:**
- After connecting to OpenAI Realtime API, receiving `server_error` when sending audio data
- Error message: `The server had an error while processing your request`
- WebSocket connection closes immediately (code 1000)
- Error timing: triggered immediately after sending audio data, after `session.created`

**Attempted Solutions:**

#### 1. Backend WebSocket Proxy
- ✅ Created backend WebSocket proxy (solved browser's inability to set Authorization header)
- ✅ Added `OpenAI-Beta: realtime=v1` header

#### 2. Message Processing Improvements
- ✅ Fixed Blob/ArrayBuffer to string conversion issues
- ✅ Improved message parsing logic
- ✅ Added detailed error logging

#### 3. Session Initialization Strategy
- ✅ Implemented two-step initialization: first send `text` modality, then add `audio` modality
- ✅ Discovered OpenAI automatically includes `audio` modality in `session.created`
- ✅ Improved logic: check if `session.created` already includes `audio`, if so skip Step 2

#### 4. Timing Optimization
- ✅ Increased initialization wait time: from 1.5 seconds to 2 seconds
- ✅ Added additional delay: wait another 500ms before processing pending audio
- ✅ Limited pending audio chunks count: only send the last 2 chunks, discard old ones
- ✅ Increased delay between chunks: from 50ms to 200ms

#### 5. Audio Sending Strategy
- ✅ Implemented audio queue mechanism: queue audio when session is not ready
- ✅ Improved audio sending frequency control
- ✅ Added audio size checks and warnings

**Current Observations:**
- `session.created` succeeds, includes `audio` and `text` modalities
- Wait 2 seconds before marking session as ready
- Immediately receive `server_error` after sending audio data
- Error occurs when sending the first or second audio chunk

**Possible Causes:**
1. **Audio Format Issue**: PCM16 format may be incorrect, or audio data itself has issues
2. **API Limitations**: May have limitations on audio sending frequency or size
3. **Session State**: Although waited 2 seconds, OpenAI may need more time to fully initialize audio processing pipeline
4. **Audio Data Issue**: Audio data may be corrupted during conversion
5. **API Bug**: May be a known issue with OpenAI Realtime API (Beta stage)

**Next Steps:**
1. **Check Audio Format**:
   - Verify PCM16 conversion is correct
   - Check if audio sample rate and format meet requirements
   - Try sending empty audio data for testing

2. **Simplify Testing**:
   - Try sending only one very small audio chunk
   - Increase wait time before sending (3-5 seconds)
   - Check if need to send `input_audio_buffer.commit` or other initialization messages first

3. **Review Official Documentation**:
   - Re-check OpenAI Realtime API official documentation
   - Check if there are missing initialization steps
   - Verify correct format and timing for audio sending

4. **Contact Support**:
   - If issue persists, contact OpenAI support with session ID
   - Provide complete error logs and session ID

5. **Alternative Solutions**:
   - Consider using combined APIs (Whisper + Chat Completions + TTS)
   - Evaluate other voice API services

---

## Development Workflow

1. **Initial Setup**: Used AI to generate project structure and configuration files
2. **Backend Development**: Generated Express server with LiveKit token endpoint
3. **Frontend Components**: Created React components with TypeScript
4. **Integration**: Connected LiveKit and OpenAI APIs
5. **Troubleshooting**: Iteratively fixed connection and audio processing issues
6. **Current**: Working on OpenAI Realtime API connection stability

## Key Learnings

- **Specific Prompts Work Better**: Providing detailed requirements and tech stack information yields better results
- **Iterative Refinement**: Initial AI output often needs refinement for production use
- **Documentation Matters**: Clear documentation helps AI understand context better
- **Error Handling**: Always ask AI to include error handling and edge cases
- **User Feedback is Valuable**: User observations (like "too early disconnect") help identify real issues
- **Browser Limitations**: WebSocket in browsers has limitations (no custom headers), requiring backend proxies

## Conclusion

AI tools significantly accelerated the development process, especially for:
- Project structure setup
- API integration patterns
- Component architecture
- Configuration file generation
- Troubleshooting and debugging
- Documentation creation

However, manual refinement was necessary for:
- Complex WebSocket implementations
- Audio format conversions
- Production-ready error handling
- Security considerations
- Browser-specific limitations
- API-specific requirements

The combination of AI assistance and manual refinement resulted in a mostly functional application. The core infrastructure is complete, but there's an ongoing issue with OpenAI Realtime API connection that requires further investigation.

**Current Completion Status**: ~75%
- ✅ Core infrastructure: 100%
- ✅ LiveKit integration: 100%
- ✅ UI components: 100%
- ✅ OpenAI integration: 70% (connection works, session created successfully, but server_error when sending audio)
- ✅ Audio processing: 85% (capture and format conversion works, but sending to OpenAI causes errors)
- ✅ Documentation: 100%
- ✅ Backend WebSocket proxy: 100%
- ✅ Error handling and logging: 100%

**Recent Improvements:**
- ✅ Fixed session initialization logic (checking for audio modality in session.created)
- ✅ Improved timing and delays for session readiness (increased to 6 seconds)
- ✅ Implemented audio queueing mechanism
- ✅ Optimized audio chunk sending strategy
- ✅ Enhanced error logging and debugging
- ✅ Improved base64 encoding (simplified approach)
- ✅ Enhanced audio data validation (NaN, Infinity, range checks)
- ✅ Removed empty commit that might cause server_error

**Current Issue:**
- ❌ **Persistent `server_error`**: After sending the first audio chunk, OpenAI immediately returns `server_error`
- **Observations**:
  - Session creation succeeds with `audio` and `text` modalities
  - Audio format validation passes (PCM16, 24kHz, little-endian)
  - Base64 encoding appears correct
  - But `server_error` occurs immediately after first audio chunk
- **Possible Causes**:
  1. OpenAI Realtime API known issue (Beta stage)
  2. Audio format may not meet strict API requirements (despite appearing correct)
  3. API server-side issue
- **Recommendations**:
  - Contact OpenAI support with session ID and detailed error logs
  - Check OpenAI Status Page for known issues
  - Consider alternative audio formats or sending strategies

