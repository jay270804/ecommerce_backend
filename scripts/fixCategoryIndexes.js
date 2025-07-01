const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function fixIndexes() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const collection = mongoose.connection.collection('categories');
  // Drop the old unique index on name
  try {
    await collection.dropIndex('name_1');
    console.log('Dropped old unique index on name');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Old unique index on name does not exist');
    } else {
      console.error('Error dropping index:', err);
    }
  }
  mongoose.disconnect();
}

fixIndexes();