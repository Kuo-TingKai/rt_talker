/**
 * Test script to verify OpenAI API key and Realtime API access
 * Run with: node scripts/test-openai.js
 */

require('dotenv').config();

async function testOpenAIAPI() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  console.log('🔍 Testing OpenAI API Configuration...\n');

  // Check if API key exists
  if (!apiKey) {
    console.error('❌ ERROR: NEXT_PUBLIC_OPENAI_API_KEY is not set in .env file');
    console.log('\n💡 Please add the following to your .env file:');
    console.log('   NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here\n');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk-')) {
    console.warn('⚠️  WARNING: API key should start with "sk-"');
  }

  console.log('✅ API Key found:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('');

  // Test basic API access
  try {
    console.log('📡 Testing basic API access...');
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Basic API access: SUCCESS');
      console.log(`   Available models: ${data.data.length} models`);
      console.log('');
    } else {
      const error = await response.json();
      console.error('❌ Basic API access: FAILED');
      console.error(`   Error: ${error.error?.message || response.statusText}`);
      console.error(`   Status: ${response.status}`);
      console.log('');
      console.log('💡 Possible issues:');
      console.log('   - API key is invalid or expired');
      console.log('   - API key does not have proper permissions');
      console.log('   - Account may need billing setup');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    process.exit(1);
  }

  // Test Realtime API access
  console.log('📡 Testing Realtime API access...');
  console.log('   (This may take a few seconds...)');
  
  try {
    // Try to establish WebSocket connection to Realtime API
    const WebSocket = require('ws');
    const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const timeout = setTimeout(() => {
        ws.close();
        console.log('⚠️  Realtime API: Connection timeout');
        console.log('   This might mean:');
        console.log('   - Realtime API is not available for your account');
        console.log('   - You need to apply for Realtime API access');
        console.log('   - Network connectivity issues');
        console.log('');
        console.log('💡 Alternative: You can still use the app with:');
        console.log('   - Whisper API (speech-to-text)');
        console.log('   - Chat Completions API (text conversation)');
        console.log('   - TTS API (text-to-speech)');
        resolve();
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ Realtime API: Connection SUCCESS');
        console.log('   Your account has access to Realtime API!');
        console.log('');
        
        // Send a test message
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text'],
          },
        }));

        setTimeout(() => {
          ws.close();
          resolve();
        }, 1000);
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Realtime API: Connection FAILED');
        console.error(`   Error: ${error.message}`);
        console.log('');
        console.log('💡 This usually means:');
        console.log('   - Realtime API is not available for your account yet');
        console.log('   - You need to apply for Realtime API beta access');
        console.log('   - Check OpenAI documentation for current availability');
        console.log('');
        console.log('💡 You can still use the app with alternative APIs');
        resolve();
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  } catch (error) {
    console.error('❌ Realtime API test error:', error.message);
    console.log('');
    console.log('💡 Note: Realtime API may require special setup');
    console.log('   Check OPENAI_SETUP_GUIDE.md for more information');
  }
}

// Run tests
testOpenAIAPI()
  .then(() => {
    console.log('✨ Testing complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Start backend server: npm run server');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Open http://localhost:3003 in your browser');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

