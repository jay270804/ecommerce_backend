require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Ecommerce API is running',
        endpoints: {
            // Auth endpoints
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout',
            refreshToken: 'POST /api/auth/refresh-token',
            requestPasswordReset: 'POST /api/auth/request-password-reset',
            resetPassword: 'POST /api/auth/reset-password',
            verifyEmail: 'GET /api/auth/verify-email/:userId/:token',
            getProfile: 'GET /api/auth/profile',
            updateProfile: 'PUT /api/auth/profile',

            // User management (Admin only)
            getAllUsers: 'GET /api/users',
            getUserById: 'GET /api/users/:id',
            updateUser: 'PUT /api/users/:id',
            deleteUser: 'DELETE /api/users/:id',
            getUserStats: 'GET /api/users/stats',

            // Product endpoints
            products: '/api/products',
            createProduct: 'POST /api/products (Admin)',
            getAllProducts: 'GET /api/products',
            getProductById: 'GET /api/products/{id}',
            updateProduct: 'PUT /api/products/{id} (Admin)',
            deleteProduct: 'DELETE /api/products/{id} (Admin)',
            filterMetadata: 'GET /api/products/filters/metadata',
            uploadImage: 'POST /api/products/upload-image (Admin)',

            // Category endpoints
            categories: '/api/categories',
            createCategory: 'POST /api/categories (Admin)',
            updateCategory: 'PUT /api/categories/:id (Admin)',
            deleteCategory: 'DELETE /api/categories/:id (Admin)',
            categoryStats: 'GET /api/categories/stats (Admin)',

            // Brand endpoints
            brands: '/api/brands',
            createBrand: 'POST /api/brands (Admin)',
            updateBrand: 'PUT /api/brands/:id (Admin)',
            deleteBrand: 'DELETE /api/brands/:id (Admin)',
            brandStats: 'GET /api/brands/stats (Admin)'
        },
        staticFiles: '/uploads/products/'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}`);
    console.log(`Static files served from: http://localhost:${PORT}/uploads/`);
});