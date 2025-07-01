require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

const dummyProducts = [
    {
        name: 'Samsung Galaxy S24 Ultra Screen Protector',
        price: 25.99,
        summary: 'Premium tempered glass screen protector for Galaxy S24 Ultra.',
        description: '9H hardness tempered glass with oleophobic coating to prevent fingerprints. Ultra-clear and touch-sensitive.',
        coverImage: 'https://placehold.co/600x400/0000FF/FFFFFF?text=Galaxy+S24+Protector',
        images: [
          'https://placehold.co/600x400/3333FF/FFFFFF?text=Protector+View+1',
          'https://placehold.co/600x400/6666FF/FFFFFF?text=Protector+View+2',
          'https://placehold.co/600x400/9999FF/FFFFFF?text=Protector+View+3',
        ],
        discountPercentage: 10,
        stockUnit: 250,
        tags: ['samsung', 'galaxy s24', 'screen protector', 'tempered glass'],
        categoryName: 'Oca glasses',
        brandName: 'Samsung',
      },
      {
        name: 'iPhone 15 Pro Max Body Housing',
        price: 150.0,
        summary: 'Replacement body housing for iPhone 15 Pro Max.',
        description: 'Complete back housing assembly with buttons and SIM tray. Perfect for repairs and color changes.',
        coverImage: 'https://placehold.co/600x400/E8E8E8/000000?text=iPhone+15+Body',
        images: [
          'https://placehold.co/600x400/DCDCDC/000000?text=Body+View+1',
          'https://placehold.co/600x400/F5F5F5/000000?text=Body+View+2',
        ],
        discountPercentage: 0,
        stockUnit: 50,
        tags: ['apple', 'iphone 15 pro max', 'housing', 'repair'],
        categoryName: 'Body',
        brandName: 'Apple',
      },
      {
        name: 'Professional Microscope for Repair',
        price: 399.5,
        summary: 'Trinocular stereo microscope for detailed electronics repair.',
        description: '7X-45X zoom trinocular stereo microscope with LED ring light, perfect for soldering and motherboard repairs.',
        coverImage: 'https://placehold.co/600x400/C0C0C0/000000?text=Microscope',
        images: [
          'https://placehold.co/600x400/D3D3D3/000000?text=Microscope+View+1',
          'https://placehold.co/600x400/A9A9A9/FFFFFF?text=Microscope+View+2',
        ],
        discountPercentage: 5,
        stockUnit: 30,
        tags: ['tools', 'repair', 'microscope', 'soldering'],
        categoryName: 'Microscope',
        brandName: 'Repairing Tools & Machines',
      },
      {
        name: 'T-7000 Multipurpose Glue',
        price: 9.99,
        summary: 'Black industrial-strength adhesive for phone repairs.',
        description: '110ml tube of T-7000 glue, ideal for bonding phone frames, screens, and back glass. Medium viscosity and waterproof.',
        coverImage: 'https://placehold.co/600x400/000000/FFFFFF?text=T-7000+Glue',
        images: [
            'https://placehold.co/600x400/36454F/FFFFFF?text=Glue+View+1',
            'https://placehold.co/600x400/808080/FFFFFF?text=Glue+View+2',
        ],
        discountPercentage: 0,
        stockUnit: 500,
        tags: ['tools', 'glue', 'adhesive', 'repair'],
        categoryName: 'Glue',
        brandName: 'Tools',
      },
      {
        name: 'Samsung S23 FE Camera Lens Replacement',
        price: 15.50,
        summary: 'OEM replacement camera lens for Samsung S23 FE.',
        description: 'High-quality glass lens replacement for the rear camera of the Samsung Galaxy S23 FE. Includes adhesive.',
        coverImage: 'https://placehold.co/600x400/4169E1/FFFFFF?text=S23+Lens',
        images: [
            'https://placehold.co/600x400/87CEEB/FFFFFF?text=Lens+View+1',
            'https://placehold.co/600x400/ADD8E6/000000?text=Lens+View+2',
        ],
        discountPercentage: 0,
        stockUnit: 150,
        tags: ['samsung', 's23 fe', 'camera', 'repair', 'lens'],
        categoryName: 'Cameras',
        brandName: 'Samsung',
      },
      {
        name: 'iPhone 14 Pro Earpiece Speaker',
        price: 22.00,
        summary: 'Replacement earpiece speaker for iPhone 14 Pro.',
        description: 'Original quality earpiece speaker for fixing audio issues during calls on the iPhone 14 Pro.',
        coverImage: 'https://placehold.co/600x400/2F4F4F/FFFFFF?text=iPhone+Speaker',
        images: [
            'https://placehold.co/600x400/708090/FFFFFF?text=Speaker+View+1',
            'https://placehold.co/600x400/778899/FFFFFF?text=Speaker+View+2',
        ],
        discountPercentage: 10,
        stockUnit: 80,
        tags: ['apple', 'iphone 14 pro', 'speaker', 'repair', 'audio'],
        categoryName: 'Speakers & ringer',
        brandName: 'Apple',
      },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');

    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Products cleared.');

    console.log('Fetching existing brands and categories...');
    const brands = await Brand.find({}).populate('categories');

    if (brands.length === 0) {
      console.error('Brands not found. Please run the seed.js script first.');
      process.exit(1);
    }

    const brandsMap = new Map(brands.map(b => [b.name, b]));

    console.log('Seeding new products...');
    for (const productData of dummyProducts) {
      const brand = brandsMap.get(productData.brandName);

      if (!brand) {
        console.warn(`Brand "${productData.brandName}" not found for product "${productData.name}". Skipping.`);
        continue;
      }

      const category = brand.categories.find(c => c.name === productData.categoryName);

      if (!category) {
        console.warn(`Category "${productData.categoryName}" not found for brand "${productData.brandName}". Skipping product "${productData.name}".`);
        continue;
      }

      const product = new Product({
        ...productData,
        categoryId: category._id,
      });
      const savedProduct = await product.save();
      
      await Category.findByIdAndUpdate(category._id, {
        $push: { products: savedProduct._id }
      });
    }
    console.log(`${dummyProducts.length} products have been seeded.`);

    console.log('Database product seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database with products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDatabase();