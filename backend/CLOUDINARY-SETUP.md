# Cloudinary Setup Instructions

## The Issue
You're seeing this error: **"Failed to upload file to cloud storage"**

This happens because Cloudinary credentials are not configured. The current `.env` file has placeholder values.

## Quick Fix: Get Free Cloudinary Credentials

### Option 1: Sign up for Free Cloudinary Account (Recommended)

1. **Go to Cloudinary:** https://cloudinary.com/users/register_free
2. **Sign up** with your email (free account gives 25GB storage)
3. **After login, go to Dashboard:** https://cloudinary.com/console
4. **Copy your credentials:**
   - Cloud Name
   - API Key
   - API Secret

5. **Update your `.env` file:**
   ```env
   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   CLOUDINARY_API_KEY=your_actual_api_key
   CLOUDINARY_API_SECRET=your_actual_api_secret
   ```

6. **Restart the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Use Existing Cloudinary Account

If you already have a Cloudinary account:

1. Login to https://cloudinary.com/console
2. Copy the credentials from your dashboard
3. Update the `.env` file with your real credentials
4. Restart the backend server

## Verification

After setting up, try uploading a file again. You should see:
- ✅ File uploads successfully
- ✅ No timeout errors
- ✅ Resource appears in your resource list

## Free Tier Limits

Cloudinary free tier includes:
- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ Perfect for development and small projects

## Important Notes

- Never commit your actual Cloudinary credentials to Git
- Keep your API Secret private
- The `.env` file is already in `.gitignore`
