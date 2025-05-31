// apps/web/app/api/generated-posts/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generatedPostModel } from '../../../../../../../packages/database/src/models/generated-post';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const success = await generatedPostModel.updateStatus(params.id, 'approved');
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post approved successfully'
    });
  } catch (error) {
    console.error('Error approving post:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
