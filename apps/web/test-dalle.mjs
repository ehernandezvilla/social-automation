// apps/web/test-dalle.mjs
import dotenv from 'dotenv';

dotenv.config();
// Función de test simplificada
async function testDALLEGeneration() {
  console.log('🧪 Testing DALL-E Image Generation...');
  console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ No OpenAI API key found in .env');
    return;
  }

  try {
    // Crear prompt optimizado
    const imagePrompt = `Create a modern tech, sleek, professional, blue and white color scheme image representing technology and innovation concepts. 
    The image should be perfect for social media posting, visually engaging, 
    and professional. No text overlays needed. 
    Style: modern tech, sleek, professional, blue and white color scheme. 
    Theme: Create content about emerging technologies and their impact on business...
    Square format suitable for Instagram.`.trim().replace(/\s+/g, ' ');

    console.log('📝 Generated prompt:', imagePrompt);

    // Llamar a DALL-E 3 API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ DALL-E API Error:', response.status, errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ DALL-E Response received');

    if (data.data && data.data[0] && data.data[0].url) {
      const imageUrl = data.data[0].url;
      console.log('🎉 SUCCESS! Image URL:', imageUrl);
      console.log('📊 Image details:', {
        size: '1024x1024',
        format: 'PNG',
        expires: 'In 1 hour (DALL-E temporary URL)'
      });
    } else {
      console.error('❌ Unexpected response format:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDALLEGeneration();