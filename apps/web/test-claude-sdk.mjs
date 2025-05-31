// test-claude-sdk.js (crear temporalmente en apps/web/)
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

async function testClaude() {
  console.log('🧪 Testing Claude SDK...');
  console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);
  
  if (!process.env.CLAUDE_API_KEY) {
    console.log('❌ No API key found');
    return;
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Say hello and return JSON: {\"message\": \"hello\", \"status\": \"working\"}"
        }
      ]
    });

    console.log('✅ Success!');
    console.log('Response:', message.content[0].text);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testClaude();