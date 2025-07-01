const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

const seedData = [
  {
    name: 'Samsung',
    categories: [
      'Frames', 'Displays', 'Spare parts', 'Cameras', 'Flex', 'Oca glasses', 'Speakers & ringer', 'Other parts', 'Back glass', 'Body'
    ]
  },
  {
    name: 'Apple',
    categories: [
      'Display Frames', 'Body', 'Displays', 'Spare parts', 'Rear & front Cameras', 'Flex', 'Oca glasses', 'Speakers & ringer', 'Other parts', 'Back glass'
    ]
  },
  {
    name: 'Tools',
    categories: [
      'Glue', 'Chemicals ( loca )', 'Scraper', 'Opening tools', 'Glue remover'
    ]
  },
  {
    name: 'Repairing Tools & Machines',
    categories: [
      'Pre heater', 'Microscope', 'Smd', 'Punching machine', 'Uv machine', 'De-bubbler', 'Cold laser machine', 'Flex bonding machine', 'Line repairs machine', 'Copper paste', 'Oca wires'
    ]
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await Brand.deleteMany({});
  await Category.deleteMany({});

  for (const brandData of seedData) {
    const brand = new Brand({ name: brandData.name });
    await brand.save();
    for (const catName of brandData.categories) {
      const category = new Category({ name: catName, brand: brand._id });
      await category.save();
      brand.categories.push(category._id);
      await brand.save();
    }
  }
  console.log('Seed complete!');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  mongoose.disconnect();
});