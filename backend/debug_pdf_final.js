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

async function testPdfUpload() {
    const dummyPath = path.join(__dirname, 'valid_test.pdf');
    
    // Create a generic minimal valid PDF
    const validPdfContent = Buffer.from(
        '%PDF-1.7\n' +
        '1 0 obj\n' +
        '<< /Type /Catalog /Pages 2 0 R >>\n' +
        'endobj\n' +
        '2 0 obj\n' +
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n' +
        'endobj\n' +
        '3 0 obj\n' +
        '<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 600 800] >>\n' +
        'endobj\n' +
        'xref\n' +
        '0 4\n' +
        '0000000000 65535 f \n' +
        '0000000010 00000 n \n' +
        '0000000060 00000 n \n' +
        '0000000115 00000 n \n' +
        'trailer\n' +
        '<< /Size 4 /Root 1 0 R >>\n' +
        'startxref\n' +
        '200\n' +
        '%%EOF'
    );
    
    fs.writeFileSync(dummyPath, validPdfContent);

    try {
        console.log('--- TEST 1: Upload as IMAGE ---');
        try {
            const resultImage = await cloudinary.uploader.upload(dummyPath, {
                folder: 'learnbox/debug_pdf_image',
                resource_type: 'image',
                type: 'upload'
            });
            console.log('Image Upload URL:', resultImage.secure_url);
            await checkUrl(resultImage.secure_url, 'Image Type');
            await cloudinary.uploader.destroy(resultImage.public_id, { resource_type: 'image' });
        } catch (e) {
            console.log('Image upload failed:', e.message);
        }

        console.log('\n--- TEST 2: Upload as RAW ---');
        try {
            const resultRaw = await cloudinary.uploader.upload(dummyPath, {
                folder: 'learnbox/debug_pdf_raw',
                resource_type: 'raw',
                type: 'upload'
            });
            console.log('Raw Upload URL:', resultRaw.secure_url);
            await checkUrl(resultRaw.secure_url, 'Raw Type');
            await cloudinary.uploader.destroy(resultRaw.public_id, { resource_type: 'raw' });
        } catch (e) {
             console.log('Raw upload failed:', e.message);
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    } finally {
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
}

function checkUrl(url, label) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log(`[${label}] Status Code: ${res.statusCode}`);
            resolve();
        }).on('error', (e) => {
            console.error(`[${label}] Error:`, e.message);
            resolve();
        });
    });
}

testPdfUpload();