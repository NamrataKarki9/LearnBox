import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testImageUpload() {
    const dummyPath = path.join(__dirname, 'test-image-upload.pdf');
    // Create a dummy PDF (just text, won't be a valid PDF but Cloudinary accepts it for upload test)
    // Actually, Cloudinary validity check might fail if it's not a real PDF header for 'image' type.
    // Let's copy the code from a dummy valid PDF header or just trust the user's file would work.
    // Better: use 'auto' which should handle it.
    
    fs.writeFileSync(dummyPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    try {
        console.log('Uploading as resource_type: "image"...');
        const result = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_image',
            resource_type: 'image', // Explicitly strict test
            type: 'upload'
        });
        
        console.log('Upload Success!');
        console.log('URL:', result.secure_url);
        console.log('Format:', result.format);
        console.log('Type:', result.type);
        console.log('Resource Type:', result.resource_type);
        
        // Clean up
        await cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' });
        
    } catch (error) {
        console.error('Upload Failed:', error.message);
    } finally {
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
}

testImageUpload();