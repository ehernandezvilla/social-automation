// packages/database/src/scripts/test-connection.ts
import { connectToDatabase, closeDatabaseConnection, checkDatabaseConnection } from '../src/connection';

async function testConnection() {
  console.log('🧪 Testing MongoDB connection...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { client, db } = await connectToDatabase();
    console.log('✅ Connected successfully');
    
    // Test 2: Database ping
    console.log('\n2️⃣ Testing database ping...');
    const isHealthy = await checkDatabaseConnection();
    console.log(isHealthy ? '✅ Database is healthy' : '❌ Database ping failed');
    
    // Test 3: List collections
    console.log('\n3️⃣ Listing existing collections...');
    const collections = await db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
    
    // Test 4: Test write operation
    console.log('\n4️⃣ Testing write operation...');
    const testCollection = db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Write operation successful');
    
    // Clean up test
    await testCollection.deleteMany({ test: true });
    console.log('✅ Test cleanup completed');
    
    console.log('\n🎉 All tests passed! MongoDB is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        console.log('\n💡 Suggestions:');
        console.log('   - Check your username and password');
        console.log('   - Make sure the user has proper permissions');
        console.log('   - Verify the database name is correct');
      } else if (error.message.includes('network')) {
        console.log('\n💡 Suggestions:');
        console.log('   - Check your internet connection');
        console.log('   - Verify the cluster URL is correct');
        console.log('   - Check if your IP is whitelisted in MongoDB Atlas');
      }
    }
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly
if (require.main === module) {
  testConnection();
}

export { testConnection };