# Cloudinary Setup Guide

## Overview
Images for menu items and categories are now stored in Cloudinary instead of local disk storage. This provides:
- Persistent storage across deployments
- Automatic image optimization
- CDN delivery for faster loading
- Easy image management and replacement

## Setup Steps

### 1. Create Cloudinary Account
- Go to https://cloudinary.com
- Sign up for a free account
- Verify your email

### 2. Get Your Credentials
- Log in to Cloudinary Dashboard
- Go to Settings → API Keys
- Copy these values:
  - **Cloud Name** (visible in dashboard)
  - **API Key**
  - **API Secret**

### 3. Update Environment Variables

**In `.env` (root directory):**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**In `backend/.env`:**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Restart Backend
```bash
npm run dev
```

## How It Works

### Upload Flow
1. Admin uploads image via menu/category form
2. Image is sent to backend as multipart form data
3. Backend uploads to Cloudinary using `uploadImage()` utility
4. Cloudinary returns secure URL
5. URL is stored in MongoDB
6. Frontend displays image from Cloudinary CDN

### Update Flow
1. Admin uploads new image for existing item/category
2. Old image's public ID is extracted from URL
3. Old image is deleted from Cloudinary
4. New image is uploaded to Cloudinary
5. New URL replaces old URL in database

### Delete Flow
1. Admin deletes menu item or category
2. Image's public ID is extracted from URL
3. Image is deleted from Cloudinary
4. Item/category is deleted from database

## Image Organization

Images are organized in Cloudinary folders:
- `spice-hut/menu-items/` - Menu item images
- `spice-hut/categories/` - Category images

## File Size Limits
- Maximum: 5MB per image
- Supported formats: JPEG, JPG, PNG, WebP

## Troubleshooting

### Images not uploading
- Check Cloudinary credentials in `.env`
- Verify API key and secret are correct
- Check file size (max 5MB)
- Check file format (JPEG, PNG, WebP only)

### Old images not deleting
- Cloudinary deletion is non-blocking (won't fail upload)
- Check Cloudinary dashboard to verify deletion
- Manual cleanup can be done in Cloudinary console

### Images not displaying
- Verify Cloudinary URL is correct
- Check image exists in Cloudinary dashboard
- Clear browser cache
- Check CORS settings if needed

## Cloudinary Dashboard
- View all uploaded images: https://cloudinary.com/console
- Manage folders and organize images
- View usage statistics
- Configure image transformations

## Migration from Local Storage
If you have existing images stored locally:
1. Manually upload them to Cloudinary
2. Update database records with new Cloudinary URLs
3. Delete local `backend/uploads/` directory

## Cost Considerations
- Free tier: 25 GB storage, 25 GB bandwidth/month
- Sufficient for small to medium restaurants
- Upgrade as needed for higher usage
