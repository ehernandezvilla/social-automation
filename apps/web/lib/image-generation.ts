// apps/web/lib/image-generation.ts
import { PostTemplate } from '../../../packages/database/src/models/post-template';

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  error?: string;
}

/**
 * Genera un prompt optimizado para DALL-E basado en el template
 */
function createImagePrompt(template: PostTemplate, textContent: string): string {
  // Extraer conceptos clave del contenido
  const firstKeyword = template.seoKeywords[0] || 'technology';
  const contentPreview = textContent.substring(0, 100).toLowerCase();

  console.log('🔍 Extracting keywords from content:', contentPreview);
  
  // Determinar estilo según el contexto
  let style = 'professional, clean, modern';
  let subject = firstKeyword;
  
  // Personalizar según keywords
  if (template.seoKeywords.some(k => ['tech', 'technology', 'AI', 'innovation'].includes(k.toLowerCase()))) {
    style = 'modern tech, sleek, professional, blue and white color scheme';
    subject = 'technology and innovation concepts';
  } else if (template.seoKeywords.some(k => ['motivation', 'success', 'growth'].includes(k.toLowerCase()))) {
    style = 'inspirational, uplifting, warm colors, professional';
    subject = 'success and growth concepts';
  } else if (template.seoKeywords.some(k => ['business', 'entrepreneur'].includes(k.toLowerCase()))) {
    style = 'corporate, professional, sophisticated, business-like';
    subject = 'business and entrepreneurship';
  }

  // Crear prompt optimizado para redes sociales
  const prompt = `Create a ${style} image representing ${subject}. 
  The image should be perfect for social media posting, visually engaging, 
  and professional. No text overlays needed. 
  Style: ${style}. 
  Theme: ${template.context.substring(0, 50)}...
  Square format suitable for Instagram.`;

  return prompt.trim().replace(/\s+/g, ' ');
}

/**
 * Genera imagen usando DALL-E 3
 */
export async function generateImageWithDALLE(
  template: PostTemplate, 
  textContent: string
): Promise<ImageGenerationResult> {
  console.log('🎨 Starting DALL-E image generation...');

  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY not found');
    return {
      success: false,
      error: 'OpenAI API key not configured'
    };
  }

  try {
    // 1. Crear prompt optimizado
    const imagePrompt = createImagePrompt(template, textContent);
    console.log('📝 Generated image prompt:', imagePrompt);

    // 2. Llamar a DALL-E 3 API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024', // Perfecto para Instagram posts
        quality: 'standard', // 'hd' es más caro pero mejor calidad
        style: 'natural', // 'natural' o 'vivid'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ DALL-E API Error:', response.status, errorData);
      
      return {
        success: false,
        error: `DALL-E API error: ${response.status}`,
        imagePrompt
      };
    }

    const data = await response.json();
    console.log('✅ DALL-E response received');

    // 3. Extraer URL de la imagen
    if (data.data && data.data[0] && data.data[0].url) {
      const imageUrl = data.data[0].url;
      console.log('🖼️ Image generated successfully:', imageUrl);

      return {
        success: true,
        imageUrl,
        imagePrompt
      };
    } else {
      console.error('❌ Unexpected DALL-E response format:', data);
      return {
        success: false,
        error: 'Unexpected response format from DALL-E',
        imagePrompt
      };
    }

  } catch (error) {
    console.error('❌ Error in DALL-E generation:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      imagePrompt: createImagePrompt(template, textContent)
    };
  }
}

/**
 * Función de fallback si DALL-E falla
 */
export function getFallbackImageUrl(template: PostTemplate): string {
  // Por ahora, usamos placeholders de Unsplash relacionados con las keywords
  const keyword = template.seoKeywords[0] || 'technology';
  const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '-');
  
  // URLs de fallback temáticos
  const fallbackImages = {
    technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1024&h=1024&fit=crop',
    innovation: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1024&h=1024&fit=crop',
    business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1024&h=1024&fit=crop',
    motivation: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop',
    ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1024&h=1024&fit=crop'
  };

  return fallbackImages[cleanKeyword as keyof typeof fallbackImages] || 
         `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1024&h=1024&fit=crop&q=80`;
}