/**
 * Multer Middleware Configuration
 * Handles file upload validation and temporary storage
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `resource-${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow PDFs and documents
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    }
});

/**
 * Middleware for single PDF upload
 */
export const uploadSinglePDF = upload.single('file');

/**
 * Middleware for single PDF upload (for MCQ generation)
 */
export const uploadPDFForMCQ = upload.single('pdfFile');

/**
 * Middleware for multiple PDF uploads
 */
export const uploadMultiplePDFs = upload.array('files', 5); // Max 5 files

/**
 * Error handler for Multer errors
 */
export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 10MB.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field name. Use "file" for single upload.'
            });
        }
        return res.status(400).json({
            error: `Upload error: ${err.message}`
        });
    }
    
    if (err) {
        return res.status(400).json({
            error: err.message
        });
    }
    
    next();
};

export default upload;
