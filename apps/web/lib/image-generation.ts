// apps/web/lib/image-generation.ts
import { PostTemplate } from '../../../packages/database/src/models/post-template';

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  error?: string;
}

/**
 * Analiza el contenido del post para extraer conceptos clave
 */
function extractKeyConceptsFromContent(content: string): {
  mainTopic?: string;
  actionWords: string[];
  visualElements: string[];
} {
  const contentLower = content.toLowerCase();
  
  // Detectar temas principales por palabras clave
  const topicPatterns = {
    'kanban': 'kanban board with cards and columns',
    'agile': 'agile development team collaboration',
    'productivity': 'productivity tools and workflow optimization',
    'ai': 'artificial intelligence and machine learning concepts',
    'innovation': 'innovation and technology advancement',
    'business': 'professional business environment',
    'startup': 'startup culture and entrepreneurship',
    'marketing': 'digital marketing and social media',
    'data': 'data analytics and visualization',
    'cloud': 'cloud computing and digital infrastructure',
    'mobile': 'mobile applications and devices',
    'automation': 'automation and efficient processes'
  };

  // Encontrar el tema principal
  let mainTopic: string | undefined;
  for (const [keyword, description] of Object.entries(topicPatterns)) {
    if (contentLower.includes(keyword)) {
      mainTopic = description;
      break;
    }
  }

  // Extraer palabras de acción/movimiento
  const actionWords: string[] = [];
  const actionPatterns = [
    'transform', 'boost', 'streamline', 'optimize', 'enhance', 'improve',
    'accelerate', 'revolutionize', 'innovate', 'collaborate', 'visualize',
    'automate', 'scale', 'grow', 'connect', 'integrate'
  ];
  
  actionPatterns.forEach(action => {
    if (contentLower.includes(action)) {
      actionWords.push(action);
    }
  });

  // Elementos visuales sugeridos
  const visualElements: string[] = [];
  if (contentLower.includes('team')) visualElements.push('diverse team collaboration');
  if (contentLower.includes('workflow')) visualElements.push('organized workflow diagram');
  if (contentLower.includes('data')) visualElements.push('data charts and graphs');
  if (contentLower.includes('mobile')) visualElements.push('mobile devices and apps');
  if (contentLower.includes('growth')) visualElements.push('upward trending arrows');

  return { mainTopic, actionWords, visualElements };
}

/**
 * Genera un prompt optimizado para DALL-E basado en el contenido real del post
 */
function createImagePrompt(template: PostTemplate, textContent: string): string {
  console.log('🔍 Analyzing content for image prompt:', textContent.substring(0, 100));
  
  // Analizar el contenido real
  const analysis = extractKeyConceptsFromContent(textContent);
  
  // Determinar estilo base según las keywords del template
  let baseStyle = 'professional, modern, clean';
  let colorScheme = 'blue and white';
  
  if (template.seoKeywords.some(k => ['tech', 'technology', 'AI', 'innovation'].includes(k.toLowerCase()))) {
    baseStyle = 'modern tech, sleek, minimalist';
    colorScheme = 'blue, white, and subtle gradients';
  } else if (template.seoKeywords.some(k => ['business', 'entrepreneur', 'corporate'].includes(k.toLowerCase()))) {
    baseStyle = 'professional business, sophisticated';
    colorScheme = 'navy blue, white, and gray accents';
  } else if (template.seoKeywords.some(k => ['motivation', 'success', 'growth'].includes(k.toLowerCase()))) {
    baseStyle = 'inspirational, dynamic, uplifting';
    colorScheme = 'warm blues, orange accents, and white';
  }

  // Construir el prompt basado en el análisis
  let prompt = `Create a ${baseStyle} image`;
  
  // Agregar tema principal si se detectó
  if (analysis.mainTopic) {
    prompt += ` featuring ${analysis.mainTopic}`;
  } else {
    // Fallback a keywords del template
    const primaryKeyword = template.seoKeywords[0] || 'technology';
    prompt += ` representing ${primaryKeyword} concepts`;
  }

  // Agregar elementos visuales específicos
  if (analysis.visualElements.length > 0) {
    prompt += `, incorporating ${analysis.visualElements.slice(0, 2).join(' and ')}`;
  }

  // Agregar contexto de acción si hay palabras relevantes
  if (analysis.actionWords.length > 0) {
    const primaryAction = analysis.actionWords[0];
    prompt += `, conveying the concept of ${primaryAction}ing and progress`;
  }

  // Especificaciones técnicas
  prompt += `. Style: ${baseStyle} with ${colorScheme} color scheme.`;
  prompt += ` Perfect for social media posting, visually engaging and professional.`;
  prompt += ` No text overlays needed.`;
  prompt += ` Square format suitable for Instagram.`;
  prompt += ` High contrast, clear composition, modern aesthetic.`;

  const finalPrompt = prompt.trim().replace(/\s+/g, ' ');
  console.log('🎨 Generated contextual prompt:', finalPrompt);
  
  return finalPrompt;
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