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

// ✨ NUEVO: Estados para generación de imágenes
export type ImageStatus = 
  | 'generating'
  | 'generated' 
  | 'failed';

export interface GeneratedPost {
  _id: ObjectId;
  templateId: ObjectId;
  content: string;
  hashtags: string[];
  
  // ✨ NUEVOS CAMPOS PARA IMÁGENES
  imageUrl?: string;           // URL final de la imagen
  imagePrompt?: string;        // Prompt usado para generar
  imageStatus?: ImageStatus;   // Estado de generación de imagen
  
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

  // ✨ MÉTODO ACTUALIZADO - Ahora acepta parámetros de imagen
  async create(
    templateId: string, 
    content: string, 
    hashtags: string[],
    imageData?: {
      imageUrl?: string;
      imagePrompt?: string;
      imageStatus?: ImageStatus;
    }
  ): Promise<GeneratedPost> {
    const collection = await this.getCollection();
    
    const post: Omit<GeneratedPost, '_id'> = {
      templateId: new ObjectId(templateId),
      content,
      hashtags,
      status: 'generated',
      generatedAt: new Date(),
      retryCount: 0,
      
      // ✨ CAMPOS DE IMAGEN OPCIONALES
      ...(imageData && {
        imageUrl: imageData.imageUrl,
        imagePrompt: imageData.imagePrompt,
        imageStatus: imageData.imageStatus,
      })
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

  // ✨ NUEVO MÉTODO - Actualizar datos de imagen
  async updateImageData(
    id: string, 
    imageData: {
      imageUrl?: string;
      imagePrompt?: string;
      imageStatus: ImageStatus;
    }
  ): Promise<boolean> {
    const collection = await this.getCollection();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: imageData }
    );

    return result.modifiedCount > 0;
  }

  async findById(id: string): Promise<GeneratedPost | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }
}

export const generatedPostModel = new GeneratedPostModel();