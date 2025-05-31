// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { postTemplateModel } from '../../../../../packages/database/src/models/post-template';

export async function GET() {
  try {
    const templates = await postTemplateModel.findAll();
    
    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const template = await postTemplateModel.create(body);
    
    return NextResponse.json({
      success: true,
      data: template
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

