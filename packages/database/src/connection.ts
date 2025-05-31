import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
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