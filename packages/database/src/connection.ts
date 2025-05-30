// packages/database/src/connection.ts
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'social_automation';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Singleton connection
let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    
    console.log(`✅ Connected to MongoDB: ${DATABASE_NAME}`);
    return { client, db };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log('🔐 MongoDB connection closed');
  }
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

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

// packages/database/src/models/generated-post.ts
import { ObjectId, Collection } from 'mongodb';
import { connectToDatabase } from '../connection';

export type PostStatus = 
  | 'generating'
  | 'generated'
  | 'scheduled'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export interface GeneratedPost {
  _id: ObjectId;
  templateId: ObjectId;
  content: string;
  hashtags: string[];
  imageUrl?: string;
  videoUrl?: string;
  status: PostStatus;
  generatedAt: Date;
  reviewedAt?: Date;
  publishedAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

class GeneratedPostModel {
  private collection: Collection<GeneratedPost> | null = null;

  private async getCollection(): Promise<Collection<GeneratedPost>> {
    if (!this.collection) {
      const { db } = await connectToDatabase();
      this.collection = db.collection<GeneratedPost>('generatedPosts');
    }
    return this.collection;
  }

  async create(templateId: string, content: string, hashtags: string[]): Promise<GeneratedPost> {
    const collection = await this.getCollection();
    
    const post: Omit<GeneratedPost, '_id'> = {
      templateId: new ObjectId(templateId),
      content,
      hashtags,
      status: 'generated',
      generatedAt: new Date(),
      retryCount: 0,
    };

    const result = await collection.insertOne(post as GeneratedPost);
    
    return {
      _id: result.insertedId,
      ...post,
    };
  }

  async findAll(): Promise<GeneratedPost[]> {
    const collection = await this.getCollection();
    return await collection.find({}).sort({ generatedAt: -1 }).toArray();
  }

  async findByStatus(status: PostStatus): Promise<GeneratedPost[]> {
    const collection = await this.getCollection();
    return await collection.find({ status }).toArray();
  }

  async updateStatus(id: string, status: PostStatus, errorMessage?: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    const updateData: any = { status };
    
    if (status === 'published') {
      updateData.publishedAt = new Date();
    }
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
      updateData.retryCount = { $inc: 1 };
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  async findById(id: string): Promise<GeneratedPost | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }
}

export const generatedPostModel = new GeneratedPostModel();

// packages/database/src/scripts/create-indexes.ts
import { connectToDatabase, closeDatabaseConnection } from '../connection';

async function createIndexes() {
  try {
    console.log('🔧 Creating MongoDB indexes...');
    
    const { db } = await connectToDatabase();

    // Post Templates indexes
    await db.collection('postTemplates').createIndexes([
      { key: { isActive: 1 } },
      { key: { createdAt: -1 } },
      { key: { title: 'text', context: 'text' } }, // Text search
    ]);

    // Generated Posts indexes
    await db.collection('generatedPosts').createIndexes([
      { key: { status: 1 } },
      { key: { templateId: 1 } },
      { key: { generatedAt: -1 } },
      { key: { status: 1, generatedAt: -1 } }, // Compound for filtering
    ]);

    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly
if (require.main === module) {
  createIndexes();
}

export { createIndexes };

// packages/database/src/scripts/seed.ts
import { postTemplateModel } from '../models/post-template';
import { closeDatabaseConnection } from '../connection';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Sample templates
    const sampleTemplates = [
      {
        title: "Tech Innovation Post",
        seoKeywords: ["technology", "innovation", "AI", "future"],
        context: "Create content about emerging technologies and their impact on business",
        targetAudience: "Tech professionals and entrepreneurs aged 25-45",
        links: ["https://example.com/tech-trends"],
        attachedDocs: [],
        needsImage: true,
        needsVideo: false,
        needsReview: true,
      },
      {
        title: "Motivational Monday",
        seoKeywords: ["motivation", "productivity", "success", "mindset"],
        context: "Weekly motivational content to inspire followers",
        targetAudience: "Young professionals seeking career growth",
        links: [],
        attachedDocs: [],
        needsImage: true,
        needsVideo: false,
        needsReview: false,
      },
    ];

    for (const template of sampleTemplates) {
      await postTemplateModel.create(template);
      console.log(`✅ Created template: ${template.title}`);
    }

    console.log('🎉 Database seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

export { seed };

// packages/database/src/index.ts
export * from './connection';
export * from './models/post-template';
export * from './models/generated-post';
export * from './scripts/create-indexes';
export * from './scripts/seed';