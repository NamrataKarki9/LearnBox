import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testVideoUpload() {
    const dummyPath = path.join(__dirname, 'test-raw-2.txt');
    fs.writeFileSync(dummyPath, 'This is a text file that should be technically raw.');

    try {
        console.log('Uploading TEXT file as RAW...');
        const result = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_text',
            resource_type: 'raw', 
            type: 'upload',
            access_mode: 'public'
        });
        
        console.log('Upload Success!');
        console.log('URL:', result.secure_url);
        
        https.get(result.secure_url, (res) => {
            console.log(`Fetch Status Code: ${res.statusCode}`);
             // Cleanup
             cloudinary.uploader.destroy(result.public_id, {resource_type: 'raw'});
             if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
        });
        
    } catch (error) {
        console.error('Upload Failed:', error.message);
    }
}

testVideoUpload();