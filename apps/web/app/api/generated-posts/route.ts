// apps/web/app/api/generated-posts/route.ts
import { NextResponse } from 'next/server';
import { generatedPostModel } from '../../../../../packages/database/src/models/generated-post';

export async function GET() {
  try {
    const posts = await generatedPostModel.findAll();
    
    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length
    });
  } catch (error) {
    console.error('Error fetching generated posts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch generated posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


