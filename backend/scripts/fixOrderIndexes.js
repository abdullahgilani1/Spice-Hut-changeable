const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function fixOrderIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/spicehutDB');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const col of collections) {
      if (col.name.startsWith('orders')) {
        console.log(`\nChecking collection: ${col.name}`);
        const indexes = await db.collection(col.name).indexes();
        
        console.log('Current indexes:');
        indexes.forEach(idx => {
          console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        // Drop the old orderNumber index if it exists
        for (const idx of indexes) {
          if (idx.key.orderNumber) {
            console.log(`  Dropping old index: ${idx.name}`);
            await db.collection(col.name).dropIndex(idx.name);
            console.log(`  ✓ Dropped ${idx.name}`);
          }
        }

        // Delete orders with null orderId
        const nullOrderIdCount = await db.collection(col.name).countDocuments({ orderId: null });
        if (nullOrderIdCount > 0) {
          console.log(`  Found ${nullOrderIdCount} orders with null orderId`);
          console.log('  Deleting orders with null orderId...');
          const deleteResult = await db.collection(col.name).deleteMany({ orderId: null });
          console.log(`  ✓ Deleted ${deleteResult.deletedCount} orders with null orderId`);
        }

        // Ensure orderId index exists
        const hasOrderIdIndex = indexes.some(idx => idx.key.orderId);
        if (!hasOrderIdIndex) {
          console.log('  Creating orderId index...');
          await db.collection(col.name).createIndex({ orderId: 1 }, { unique: true });
          console.log('  ✓ Created orderId index');
        } else {
          console.log('  ✓ orderId index already exists');
        }
      }
    }

    console.log('\n✓ All order collections fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrderIndexes();
