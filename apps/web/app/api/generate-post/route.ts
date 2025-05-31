// apps/web/app/api/generate-post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { postTemplateModel } from '../../../../../packages/database/src/models/post-template';
import { generatedPostModel } from '../../../../../packages/database/src/models/generated-post';

// Primero necesitas instalar el SDK oficial de Anthropic
// npm install @anthropic-ai/sdk

import Anthropic from '@anthropic-ai/sdk';

// Configuración de LLM
const LLM_CONFIG = {
  provider: (process.env.CLAUDE_API_KEY ? 'claude' : 'openai') as 'claude' | 'openai',
  claudeApiKey: process.env.CLAUDE_API_KEY?.trim(),
  openaiApiKey: process.env.OPENAI_API_KEY?.trim(),
};

console.log('🔍 LLM Configuration:');
console.log('- Claude API Key exists:', !!LLM_CONFIG.claudeApiKey);
console.log('- OpenAI API Key exists:', !!LLM_CONFIG.openaiApiKey);
console.log('- Selected provider:', LLM_CONFIG.provider);

// Inicializar cliente de Anthropic
const anthropic = LLM_CONFIG.claudeApiKey ? new Anthropic({
  apiKey: LLM_CONFIG.claudeApiKey,
}) : null;

async function generateContentWithClaude(template: any): Promise<{ content: string; hashtags: string[] }> {
  console.log('🤖 Using Claude SDK for content generation...');
  
  if (!anthropic) {
    throw new Error('Claude client not initialized - API key missing');
  }

  const prompt = `Create an engaging social media post based on this template:

Title: ${template.title}
Context: ${template.context}
Target Audience: ${template.targetAudience}
SEO Keywords: ${template.seoKeywords.join(', ')}
Links: ${template.links.join(', ')}

Requirements:
- Create compelling content that resonates with the target audience
- Incorporate the SEO keywords naturally
- Keep it engaging and professional
- Optimal length for Instagram/LinkedIn (150-300 characters)
- Include the provided links if any
- Generate 5-8 relevant hashtags (without # symbol)

Please respond with ONLY a valid JSON object in this exact format:
{
  "content": "The main post content here...",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // o "claude-sonnet-4-20250514" si tienes acceso
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log('✅ Claude API Response received');
    
    // El SDK devuelve la respuesta en un formato diferente
    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('📝 Generated content:', content);
    
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Parsed JSON successfully:', parsed);
      
      return {
        content: parsed.content,
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      console.log('📝 Raw content that failed to parse:', content);
      
      // Fallback con contenido directo
      return {
        content: content,
        hashtags: template.seoKeywords.map((keyword: string) => keyword.replace(/\s+/g, '').toLowerCase())
      };
    }
  } catch (error) {
    console.error('❌ Error calling Claude:', error);
    throw error;
  }
}

async function generateContentWithOpenAI(template: any): Promise<{ content: string; hashtags: string[] }> {
  console.log('🤖 Using OpenAI for content generation...');
  
  if (!LLM_CONFIG.openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const prompt = `Create an engaging social media post based on this template:

Title: ${template.title}
Context: ${template.context}
Target Audience: ${template.targetAudience}
SEO Keywords: ${template.seoKeywords.join(', ')}
Links: ${template.links.join(', ')}

Requirements:
- Create compelling content that resonates with the target audience
- Incorporate the SEO keywords naturally
- Keep it engaging and professional
- Optimal length for Instagram/LinkedIn (150-300 characters)
- Include the provided links if any
- Generate 5-8 relevant hashtags (without # symbol)

Respond with ONLY a valid JSON object:
{
  "content": "The main post content here...",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_CONFIG.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed.content,
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, using raw content');
      return {
        content: content,
        hashtags: template.seoKeywords.map((keyword: string) => keyword.replace(/\s+/g, '').toLowerCase())
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

// Función de fallback mejorada
async function generateFallbackContent(template: any): Promise<{ content: string; hashtags: string[] }> {
  console.log('🔄 Using enhanced fallback content generation...');
  
  const fallbackTemplates = [
    `🚀 Exciting developments in ${template.seoKeywords[0]}! 

${template.context.substring(0, 120)}...

Perfect for ${template.targetAudience}. What are your thoughts on this trend?`,
    
    `💡 Innovation in ${template.seoKeywords[0]} is transforming how we work!

Key insights for ${template.targetAudience}:
✨ ${template.context.substring(0, 100)}...

Ready to embrace the future?`,
    
    `🎯 ${template.title}

${template.context.substring(0, 150)}...

Share your experience with ${template.seoKeywords[0]} below! 👇`
  ];
  
  const randomTemplate = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
  const content = template.links.length > 0 ? `${randomTemplate}\n\n🔗 ${template.links[0]}` : randomTemplate;

  return {
    content,
    hashtags: [
      ...template.seoKeywords.map((keyword: string) => keyword.replace(/\s+/g, '').toLowerCase()),
      'innovation', 'tech', 'future', 'growth'
    ].slice(0, 8)
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Starting POST /api/generate-post');
    
    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // 1. Buscar el template
    const template = await postTemplateModel.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    console.log('✅ Template found:', template.title);

    // 2. Generar contenido con prioridad de LLMs
    let generatedContent;
    let generationMethod = 'fallback';
    
    try {
      if (LLM_CONFIG.provider === 'claude' && anthropic) {
        generatedContent = await generateContentWithClaude(template);
        generationMethod = 'claude';
      } else if (LLM_CONFIG.openaiApiKey) {
        generatedContent = await generateContentWithOpenAI(template);
        generationMethod = 'openai';
      } else {
        throw new Error('No valid API keys available');
      }
    } catch (llmError) {
      console.error('❌ LLM Generation failed:', llmError);
      console.log('🔄 Using fallback content...');
      generatedContent = await generateFallbackContent(template);
    }

    console.log(`✅ Content generated using: ${generationMethod}`);

    // 3. Crear GeneratedPost en la BD
    const generatedPost = await generatedPostModel.create(
      templateId,
      generatedContent.content,
      generatedContent.hashtags
    );

    // 4. Si necesita review, cambiar estado
    if (template.needsReview) {
      await generatedPostModel.updateStatus(
        generatedPost._id.toString(),
        'pending_review'
      );
    }

    const finalStatus = template.needsReview ? 'pending_review' : 'generated';

    return NextResponse.json({
      success: true,
      data: {
        ...generatedPost,
        status: finalStatus,
        generationMethod // Para debugging
      }
    });

  } catch (error) {
    console.error('❌ Error in POST /api/generate-post:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}