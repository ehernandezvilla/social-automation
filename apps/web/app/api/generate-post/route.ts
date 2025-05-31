// apps/web/app/api/generate-post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { postTemplateModel } from '../../../../../packages/database/src/models/post-template';
import { generatedPostModel } from '../../../../../packages/database/src/models/generated-post';

// Configuración de LLM (puedes cambiar entre Claude y OpenAI)
const LLM_CONFIG = {
  provider: 'claude', // 'claude' | 'openai'
  apiKey: process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY,
  model: 'claude-3-sonnet-20240229' // o 'claude-3-sonnet-20240229'
};

async function generateContentWithOpenAI(template: any): Promise<{ content: string; hashtags: string[] }> {
  const prompt = `
Create an engaging social media post based on the following template:

Title: ${template.title}
Context: ${template.context}
Target Audience: ${template.targetAudience}
SEO Keywords: ${template.seoKeywords.join(', ')}
Links to include: ${template.links.join(', ')}

Requirements:
- Create compelling content that resonates with the target audience
- Incorporate the SEO keywords naturally
- Keep it engaging and professional
- Optimal length for Instagram/LinkedIn
- Include the provided links if any
- Generate 5-8 relevant hashtags

Return the response in this exact JSON format:
{
  "content": "The main post content here...",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
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
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed.content,
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
        if (parseError instanceof SyntaxError) {
            console.error('JSON parsing error:', parseError);
        }
      // Fallback si el JSON no es válido
      return {
        content: content,
        hashtags: template.seoKeywords.map((keyword: string) => `#${keyword.replace(/\s+/g, '')}`)
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

async function generateContentWithClaude(template: any): Promise<{ content: string; hashtags: string[] }> {
  // Implementación para Claude API
  const prompt = `Create an engaging social media post for:
Title: ${template.title}
Context: ${template.context}
Target: ${template.targetAudience}
Keywords: ${template.seoKeywords.join(', ')}
Links: ${template.links.join(', ')}

Return JSON: {"content": "post text", "hashtags": ["tag1", "tag2"]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    try {
      const parsed = JSON.parse(content);
      return {
        content: parsed.content,
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        console.error('JSON parsing error:', parseError);
      }
      return {
        content: content,
        hashtags: template.seoKeywords.map((keyword: string) => `#${keyword.replace(/\s+/g, '')}`)
      };
    }
  } catch (error) {
    console.error('Error calling Claude:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // 2. Generar contenido con LLM
    let generatedContent;
    try {
      if (LLM_CONFIG.provider === 'claude') {
        generatedContent = await generateContentWithClaude(template);
      } else {
        generatedContent = await generateContentWithOpenAI(template);
      }
    } catch (llmError) {
      console.error('LLM Generation Error:', llmError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate content',
          details: llmError instanceof Error ? llmError.message : 'LLM service unavailable'
        },
        { status: 500 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: {
        ...generatedPost,
        status: template.needsReview ? 'pending_review' : 'generated'
      }
    });

  } catch (error) {
    console.error('Error generating post:', error);
    
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