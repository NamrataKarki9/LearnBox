/**
 * Cloudinary Configuration
 * Handles cloud-based file storage for PDFs and other resources
 */

import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Check if Cloudinary is properly configured
 */
const isCloudinaryConfigured = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    return cloudName && apiKey && apiSecret && 
           cloudName !== 'your_cloud_name_here' && 
           apiKey !== 'your_api_key_here' && 
           apiSecret !== 'your_api_secret_here';
};

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path to upload
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with secure_url
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
    try {
        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
            throw new Error(
                'Cloudinary is not configured. Please add your Cloudinary credentials to the .env file:\n' +
                'CLOUDINARY_CLOUD_NAME=your_actual_cloud_name\n' +
                'CLOUDINARY_API_KEY=your_actual_api_key\n' +
                'CLOUDINARY_API_SECRET=your_actual_api_secret\n\n' +
                'Get your credentials from: https://cloudinary.com/console'
            );
        }

        const defaultOptions = {
            folder: 'learnbox/resources',
            resource_type: 'raw', 
            type: 'upload', 
            access_mode: 'public',
            allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'dat', 'bin'], // Allow generic binaries
            ...options
        };

        console.log('Uploading to Cloudinary with options:', JSON.stringify(defaultOptions));
        
        const result = await cloudinary.uploader.upload(filePath, defaultOptions);
        
        console.log('Cloudinary upload success. URL:', result.secure_url, 'Type:', result.type, 'Resource Type:', result.resource_type);
        
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        
        // Provide more helpful error messages
        if (error.message && error.message.includes('Cloudinary is not configured')) {
            throw error; // Re-throw configuration error with helpful message
        }
        
        if (error.http_code === 401) {
            throw new Error('Invalid Cloudinary credentials. Please check your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env file.');
        }
        
        throw new Error(`Failed to upload file to cloud storage: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file
 * @param {string} resourceType - Resource type ('image' for PDFs/documents uploaded via auto, 'raw' for raw uploads)
 * @returns {Promise<object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return {
            success: result.result === 'ok',
            result: result.result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete file from cloud storage');
    }
};

export default cloudinary;
