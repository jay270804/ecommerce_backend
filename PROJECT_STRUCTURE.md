# Ecommerce Backend Project Structure

## Directory Structure

```
ecommerce_backend/
├── config/                 # Configuration files
│   ├── database.js         # MongoDB connection
│   └── upload.js           # File upload configuration (replaces S3)
├── controllers/            # Business logic
│   └── productController.js # Product-related operations
├── middleware/             # Custom middleware
│   ├── auth.js             # Authentication & authorization
│   └── validation.js       # Request validation
├── models/                 # Database schemas
│   ├── User.js             # User model with role-based access
│   ├── Product.js          # Product model with images array
│   ├── Category.js         # Category model
│   ├── Brand.js            # Brand model
│   ├── Order.js            # Order model with status
│   ├── OrderItem.js        # Order items model
│   ├── Cart.js             # Cart model
│   ├── CartItem.js         # Cart items model
│   ├── WishList.js         # Wishlist model
│   ├── Address.js          # Address model
│   └── PaymentDetail.js    # Payment details model
├── routes/                 # API routes
│   └── products.js         # Product routes (updated for local storage)
├── utils/                  # Utility functions
│   ├── helpers.js          # General helper functions
│   └── response.js         # Standardized API responses
├── uploads/                # Static file storage
│   └── products/           # Product images directory
├── index.js                # Main application file
├── package.json            # Dependencies
└── .gitignore              # Git ignore rules
```

## Key Changes Made

### 1. **S3 Removal**
- Removed `config/s3.js` file
- Created `config/upload.js` for local file storage
- Updated product routes to use local storage instead of S3

### 2. **Model Improvements**
- **User Model**: Added `role`, `isActive`, `emailVerified`, `profileImage` fields
- **Product Model**: Added `images` array, `isActive`, `tags` fields
- **Order Model**: Added `status` and `shippingAddress` fields
- Fixed module.exports typos in PaymentDetail, OrderItem, and Address models

### 3. **Project Structure**
- Created `controllers/` directory for business logic separation
- Created `middleware/` directory for authentication and validation
- Created `utils/` directory for helper functions
- Created `uploads/` directory for static file storage

### 4. **Authentication & Authorization**
- JWT-based authentication system
- Role-based access control (user/admin)
- Middleware for protecting routes

### 5. **File Upload System**
- Local file storage using multer
- Image validation and processing
- Static file serving via Express

## Environment Variables Required

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Server
PORT=3000
NODE_ENV=development
```

## API Endpoints

### Products
- `GET /api/products` - Get all products with filtering and pagination
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `POST /api/products/upload-image` - Upload product image
- `GET /api/products/filters/metadata` - Get filter options

### Static Files
- Product images are served from `/uploads/products/`

## Authentication Flow

1. **User Registration**: Creates user with default role 'user'
2. **User Login**: Returns JWT token with user role
3. **Route Protection**: Use `authenticateToken` middleware
4. **Admin Routes**: Use `requireAdmin` middleware
5. **User-Specific Routes**: Use `requireAdminOrOwner` middleware

## File Upload Process

1. **Image Upload**: POST to `/api/products/upload-image` with form data
2. **File Storage**: Images stored in `uploads/products/` directory
3. **URL Generation**: Returns relative URL for the uploaded image
4. **Static Serving**: Images served via Express static middleware

## Next Steps

1. Implement remaining API routes (auth, cart, orders, etc.)
2. Add comprehensive error handling
3. Implement rate limiting and security measures
4. Add input sanitization and validation
5. Set up testing framework
6. Add API documentation (Swagger)
7. Implement caching strategies
8. Set up logging and monitoring