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

async function testUnsignedUpload() {
    const dummyPath = path.join(__dirname, 'test-unsigned.pdf');
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
    fs.writeFileSync(dummyPath, pdfContent);

    try {
        console.log('Uploading with access_mode: "public"...');
        const result = await cloudinary.uploader.upload(dummyPath, {
            folder: 'learnbox/debug_public',
            resource_type: 'auto', // Try auto again but explicit public
            access_mode: 'public',
            type: 'upload'
        });
        
        console.log('Upload Success!');
        console.log('URL:', result.secure_url);
        
        https.get(result.secure_url, (res) => {
            console.log(`Fetch Status Code: ${res.statusCode}`);
             // Cleanup
             cloudinary.uploader.destroy(result.public_id);
             if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
        });
        
    } catch (error) {
        console.error('Upload Failed:', error.message);
    }
}

testUnsignedUpload();