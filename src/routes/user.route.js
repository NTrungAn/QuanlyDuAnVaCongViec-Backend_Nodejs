const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

const uploadDir = path.resolve(__dirname, '..', 'images', 'avatars');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.params.userId || 'user'}-${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get('/me', protect, userController.getMe);
router.get('/', protect, authorize(['ADMIN']), userController.getAllUsers);
router.post('/assign-role', protect, authorize(['ADMIN']), userController.assignRole);
router.put('/:userId', protect, userController.updateUser);
router.post('/:userId/upload-avatar', protect, upload.single('file'), userController.uploadAvatar);
router.delete('/:userId', protect, authorize(['ADMIN']), userController.deleteUser);

module.exports = router;
