// packages/database/src/models/post-template.ts
import { ObjectId, Collection } from 'mongodb';
import { connectToDatabase } from '../connection';
import { z } from 'zod';

// Validation Schema
export const PostTemplateValidation = z.object({
  title: z.string().min(1).max(200),
  seoKeywords: z.array(z.string()).min(1).max(20),
  context: z.string().min(10).max(2000),
  targetAudience: z.string().min(5).max(500),
  links: z.array(z.string().url()).max(10).default([]),
  attachedDocs: z.array(z.string()).max(5).default([]),
  needsImage: z.boolean().default(false),
  needsVideo: z.boolean().default(false),
  needsReview: z.boolean().default(true),
});

export type PostTemplateInput = z.infer<typeof PostTemplateValidation>;

export interface PostTemplate extends PostTemplateInput {
  _id: ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class PostTemplateModel {
  private collection: Collection<PostTemplate> | null = null;

  private async getCollection(): Promise<Collection<PostTemplate>> {
    if (!this.collection) {
      const { db } = await connectToDatabase();
      this.collection = db.collection<PostTemplate>('postTemplates');
    }
    return this.collection;
  }

  async create(data: PostTemplateInput): Promise<PostTemplate> {
    // Validate input
    const validatedData = PostTemplateValidation.parse(data);
    
    const collection = await this.getCollection();
    const template: Omit<PostTemplate, '_id'> = {
      ...validatedData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(template as PostTemplate);
    
    return {
      _id: result.insertedId,
      ...template,
    };
  }

  async findAll(): Promise<PostTemplate[]> {
    const collection = await this.getCollection();
    return await collection.find({ isActive: true }).toArray();
  }

  async findById(id: string): Promise<PostTemplate | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async update(id: string, data: Partial<PostTemplateInput>): Promise<PostTemplate | null> {
    const collection = await this.getCollection();
    
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    // Soft delete
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: false, 
          updatedAt: new Date() 
        } 
      }
    );

    return result.modifiedCount > 0;
  }
}

export const postTemplateModel = new PostTemplateModel();

