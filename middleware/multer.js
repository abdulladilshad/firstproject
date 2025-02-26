
const multer = require('multer');
const path = require('path');

// Storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Save files in "public/uploads/"
    },
    filename: (req, file, cb) => {
        // Add user ID to filename to better organize uploads
        const userId = req.session.user?.id || 'unknown';
        const uniqueSuffix = `${userId}-${Date.now()}`;
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error('Only images (JPEG, JPG, PNG, GIF) are allowed'));
    }
};

// Upload function
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Increased to 5MB file limit
    },
    fileFilter: fileFilter
}).single('avatar'); // Specify field name

// Wrapper function to handle multer errors
const uploadMiddleware = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            return res.status(400).json({ 
                success: false, 
                message: `Upload error: ${err.message}` 
            });
        } else if (err) {
            // An unknown error occurred
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }
        // Everything went fine
        next();
    });
};

module.exports = uploadMiddleware;

