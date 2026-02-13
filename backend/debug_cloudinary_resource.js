import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicId = 'learnbox/colleges/5/resources/uirq3qnimkzbhx8np2ga.pdf'; 

async function checkResource() {
    try {
        console.log(`Checking resource: ${publicId}`);
        // For raw resources, type is usually 'upload'
        const result = await cloudinary.api.resource(publicId, { 
            resource_type: 'raw',
            type: 'upload' 
        });
        
        console.log('Resource Details:');
        console.log(`- Public ID: ${result.public_id}`);
        console.log(`- Type: ${result.type}`);
        console.log(`- Example URL: ${result.url}`);
        console.log(`- Secure URL: ${result.secure_url}`);
        console.log(`- Access Mode: ${result.access_mode}`);
        console.log(`- Access Control: ${JSON.stringify(result.access_control)}`);

    } catch (error) {
        console.error('Error fetching resource:', error.error ? error.error.message : error.message);
    }
}

checkResource();