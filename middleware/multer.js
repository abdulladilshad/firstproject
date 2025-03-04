
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); 
    },
    filename: (req, file, cb) => {
        
        const userId = req.session.user?.id || 'unknown';
        const uniqueSuffix = `${userId}-${Date.now()}`;
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});


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


const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: fileFilter
}).single('avatar'); 


const uploadMiddleware = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
         
            return res.status(400).json({ 
                success: false, 
                message: `Upload error: ${err.message}` 
            });
        } else if (err) {
          
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }
        
        next();
    });
};

module.exports = uploadMiddleware;

