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

async function testRawUpload() {
    const dummyPath = path.join(__dirname, 'test-raw.pdf');
    // Create a minimal valid PDF content
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
    fs.writeFileSync(dummyPath, pdfContent);

    try {
        console.log('Uploading as resource_type: "raw"...');
        const result = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_raw',
            resource_type: 'raw', 
            type: 'upload',
            use_filename: true,
            unique_filename: false
        });
        
        console.log('Upload Success!');
        console.log('URL:', result.secure_url);
        
        // Try to fetch it
        console.log('Attempting to fetch URL...');
        https.get(result.secure_url, (res) => {
            console.log(`Fetch Status Code: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('Result: SUCCESS - File is accessible!');
            } else {
                console.log('Result: FAILED - File is not accessible.');
            }
            
            // Cleanup
             cloudinary.uploader.destroy(result.public_id, { resource_type: 'raw' });
             if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
        }).on('error', (e) => {
            console.error(e);
        });
        
    } catch (error) {
        console.error('Upload Failed:', error.message);
    }
}

testRawUpload();