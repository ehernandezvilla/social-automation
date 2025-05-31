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