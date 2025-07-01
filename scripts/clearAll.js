const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function clearAll() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await Brand.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  console.log('All brands, categories, and products have been deleted.');
  mongoose.disconnect();
}

clearAll().catch(err => {
  console.error('Clear error:', err);
  mongoose.disconnect();
});