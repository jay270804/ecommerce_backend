# Ecommerce Backend API

A Node.js/Express backend API for an ecommerce application with MongoDB integration and S3 image upload functionality.

## Features

- Product management (CRUD operations)
- MongoDB integration with Mongoose
- S3 image upload and management
- Input validation
- Error handling
- CORS support
- Environment variable configuration
- Pagination and filtering
- Image cleanup on product deletion

## Product Schema

The product model includes all fields from your React Native interface plus additional fields:

```javascript
{
  id: string,              // MongoDB ObjectId
  name: string,            // Required
  price: number,           // Required, min: 0
  description: string,     // Required
  image: string,           // Required (S3 URL)
  discountPercentage: number, // Optional, 0-100
  discountedPrice: number,    // Auto-calculated
  category: string,        // Required
  brand: string,           // Required
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the root directory with the following variables:
   ```
   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string_here

   # Server Configuration
   PORT=3000

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your_s3_bucket_name

   # Optional: JWT Secret for future authentication
   JWT_SECRET=your_jwt_secret_here
   ```

3. **Start the server:**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Products

#### GET /api/products
Get all products with optional filtering and pagination
```bash
curl "http://localhost:3000/api/products?page=1&limit=10&category=Electronics&brand=Apple&minPrice=100&maxPrice=1000&sortBy=price&sortOrder=asc"
```

#### POST /api/products/upload-image
Upload product image to S3
```bash
curl -X POST http://localhost:3000/api/products/upload-image \
  -F "image=@/path/to/your/image.jpg"
```

#### POST /api/products
Create a new product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "price": 999.99,
    "description": "Latest iPhone with advanced features",
    "image": "https://your-s3-bucket.s3.amazonaws.com/products/image-url.jpg",
    "discountPercentage": 10,
    "category": "Electronics",
    "brand": "Apple"
  }'
```

#### GET /api/products/filters/metadata
Get available categories, brands, and price range for filtering
```bash
curl http://localhost:3000/api/products/filters/metadata
```

#### GET /api/products/:id
Get a specific product by ID
```bash
curl http://localhost:3000/api/products/product_id_here
```

#### PUT /api/products/:id
Update a product
```bash
curl -X PUT http://localhost:3000/api/products/product_id_here \
  -H "Content-Type: application/json" \
  -d '{
    "price": 899.99,
    "discountPercentage": 15
  }'
```

#### DELETE /api/products/:id
Delete a product (also deletes associated image from S3)
```bash
curl -X DELETE http://localhost:3000/api/products/product_id_here
```

## Image Upload Workflow

1. **Upload image to S3:**
   ```bash
   POST /api/products/upload-image
   Content-Type: multipart/form-data
   Body: image file
   ```

2. **Use the returned URL in product creation:**
   ```json
   {
     "name": "Product Name",
     "price": 99.99,
     "description": "Product description",
     "image": "https://your-s3-bucket.s3.amazonaws.com/products/uuid.jpg",
     "category": "Electronics",
     "brand": "Brand Name"
   }
   ```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "count": 1
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

## Validation Rules

- **name**: Required, string
- **price**: Required, number > 0
- **description**: Required, string
- **image**: Required, string (S3 URL)
- **discountPercentage**: Optional, number 0-100
- **category**: Required, string
- **brand**: Required, string

## S3 Configuration

### Required AWS Permissions
Your AWS IAM user needs the following S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### S3 Bucket Configuration
- Enable public read access for uploaded images
- Configure CORS if needed for direct browser uploads
- Set appropriate lifecycle policies for cost optimization

## Development

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

For development, the server will restart automatically when you make changes (using nodemon).

## MongoDB Connection

Make sure your MongoDB instance is running and accessible. The connection string should be in the format:
```
mongodb://username:password@host:port/database
```

For local development, you can use:
```
mongodb://localhost:27017/ecommerce_db
```