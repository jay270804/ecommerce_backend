# 📋 Postman Setup Guide for Product APIs

## 🚀 Quick Start

### **1. Import Collection**
1. Download `postman_products_collection.json`
2. Open Postman
3. Click **Import** → **Upload Files** → Select the JSON file
4. Collection will be imported with all product APIs

### **2. Set Environment Variables**
1. Click on the collection name
2. Go to **Variables** tab
3. Update these variables:
   ```
   base_url: http://localhost:3000/api
   admin_token: your_actual_admin_jwt_token
   product_id: 64f8a1b2c3d4e5f6a7b8c9d2 (will be updated after creating product)
   category_id: your_category_id
   brand_id: your_brand_id
   ```

### **3. Get Admin Token**
First, you need to get an admin token:
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_password"
}
```

Copy the `token` from the response and update the `admin_token` variable.

## 📝 API Usage Examples

### **1. Create Product with File Uploads (Recommended)**

#### **Step-by-Step:**
1. Select **"Create Product with Files"** request
2. Go to **Body** tab
3. Ensure **form-data** is selected
4. Fill in the text fields:
   - `name`: "iPhone 15 Pro"
   - `summary`: "Latest iPhone with advanced features"
   - `description`: "The iPhone 15 Pro features..."
   - `price`: "999.99"
   - `stockUnit`: "50"
   - `discountPercentage`: "10"
   - `categoryId`: "{{category_id}}"
   - `brandId`: "{{brand_id}}"
   - `tags`: `["smartphone", "apple", "5g", "titanium"]`

5. **Add Images:**
   - Click **Select Files** for `coverImage`
   - Click **Select Files** for each `images` field (up to 9 additional images)
   - You can add multiple `images` fields with the same key name

6. **Send Request**
7. **Copy the product ID** from response and update `product_id` variable

#### **Expected Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "iPhone 15 Pro",
    "coverImage": "uuid1_original.jpg",
    "coverImageSizes": {
      "thumbnail": "/uploads/products/uuid1_thumbnail.jpg",
      "small": "/uploads/products/uuid1_small.jpg",
      "medium": "/uploads/products/uuid1_medium.jpg",
      "large": "/uploads/products/uuid1_large.jpg",
      "original": "/uploads/products/uuid1_original.jpg"
    },
    "images": ["uuid2_original.jpg", "uuid3_original.jpg"],
    "imagesSizes": [
      {
        "thumbnail": "/uploads/products/uuid2_thumbnail.jpg",
        "small": "/uploads/products/uuid2_small.jpg",
        "medium": "/uploads/products/uuid2_medium.jpg",
        "large": "/uploads/products/uuid2_large.jpg",
        "original": "/uploads/products/uuid2_original.jpg"
      }
    ]
  }
}
```

### **2. Update Product with File Uploads**

#### **Step-by-Step:**
1. Select **"Update Product with Files"** request
2. Update the URL with your product ID: `{{base_url}}/products/{{product_id}}`
3. Go to **Body** tab
4. Fill in the fields you want to update:
   - `name`: "iPhone 15 Pro Max"
   - `price`: "1099.99"
   - `stockUnit`: "25"
   - `discountPercentage`: "15"

5. **Add New Images:**
   - Select new files for `coverImage` and `images`
   - Old images will be automatically deleted and replaced

6. **Send Request**

### **3. Create Product with Image URLs (Alternative)**

#### **Step-by-Step:**
1. Select **"Create Product with URLs"** request
2. Go to **Body** tab
3. Ensure **raw** and **JSON** are selected
4. Update the JSON with your data:
```json
{
  "name": "iPhone 15 Pro",
  "summary": "Latest iPhone with advanced features",
  "description": "The iPhone 15 Pro features the A17 Pro chip...",
  "price": 999.99,
  "stockUnit": 50,
  "discountPercentage": 10,
  "categoryId": "{{category_id}}",
  "brandId": "{{brand_id}}",
  "tags": ["smartphone", "apple", "5g", "titanium"],
  "coverImage": "https://example.com/iphone15pro.jpg",
  "images": [
    "https://example.com/iphone15pro_1.jpg",
    "https://example.com/iphone15pro_2.jpg"
  ]
}
```

5. **Send Request**

## 🔍 Understanding the Implementation

### **Why `req.body` with FormData?**

Your query about destructuring from `req.body` when using FormData is correct! Here's why:

**FormData sends both files AND text fields:**
- **Files** → `req.files` (processed by multer)
- **Text fields** → `req.body` (regular form data)

**Example FormData:**
```
name: "iPhone 15 Pro"          → req.body.name
price: "999.99"               → req.body.price
coverImage: [file]            → req.files.coverImage[0]
images: [file1]               → req.files.images[0]
images: [file2]               → req.files.images[1]
```

**Controller handles both:**
```javascript
// Text fields from req.body
const { name, price, description } = req.body;

// Files from req.files
if (req.files && req.files.coverImage) {
  const coverImageFile = req.files.coverImage[0];
}
```

### **Multiple Image Upload Support**

The implementation supports:
- **1 cover image** (`coverImage` field)
- **Up to 9 additional images** (`images` field, multiple files)
- **Automatic image processing** (5 sizes per image)
- **Automatic cleanup** of old images on update

## 🧪 Testing Scenarios

### **Test 1: Create Product with Multiple Images**
1. Use **"Create Product with Files"**
2. Add 1 cover image + 3 additional images
3. Verify all 4 images get processed (20 total files: 4 images × 5 sizes each)

### **Test 2: Update Product Images**
1. Create a product first
2. Use **"Update Product with Files"**
3. Upload new images
4. Verify old images are deleted and new ones are processed

### **Test 3: Mixed Update (Some Fields Only)**
1. Use **"Update Product with Files"**
2. Only update `name` and `price` (no images)
3. Verify existing images remain unchanged

### **Test 4: JSON vs FormData**
1. Create product with **"Create Product with URLs"** (JSON)
2. Create product with **"Create Product with Files"** (FormData)
3. Compare responses - both should work identically

## 🐛 Troubleshooting

### **Common Issues:**

1. **"No image file provided"**
   - Ensure you're using **form-data** not **x-www-form-urlencoded**
   - Check that file fields are set to **File** type in Postman

2. **"Missing required fields"**
   - Ensure all required fields are filled: `name`, `description`, `coverImage`, `price`, `categoryId`, `brandId`

3. **"Invalid token"**
   - Update the `admin_token` variable with a valid JWT token
   - Ensure the user has admin role

4. **"File too large"**
   - Images must be under 5MB each
   - Check image file size before uploading

5. **"Invalid image format"**
   - Only JPEG, PNG, and WebP are supported
   - Convert images to supported format

### **Debug Steps:**
1. Check **Authorization** tab has Bearer token
2. Verify **Content-Type** is correct (Postman sets this automatically for form-data)
3. Ensure all required fields are present
4. Check file sizes and formats
5. Verify category and brand IDs exist in database

## 📊 Response Format

All responses follow this format:
```json
{
  "success": true/false,
  "message": "Description of what happened",
  "data": {
    // Response data
  }
}
```

**Error responses:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## 🎯 Best Practices

1. **Use FormData for file uploads** (recommended)
2. **Use JSON for URL-based images** (alternative)
3. **Always include admin token** in Authorization header
4. **Test with small images first** (under 1MB)
5. **Update variables** after creating products
6. **Use meaningful product names** for easy identification

---

**Ready to test!** Import the collection and start with creating a product using file uploads. 🚀