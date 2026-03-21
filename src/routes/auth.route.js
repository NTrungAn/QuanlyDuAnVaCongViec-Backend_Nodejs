const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validate } = require('../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('../validators/auth.validator');

router.post('/login', validate(loginSchema), userController.login);
router.post('/register', validate(registerSchema), userController.register);

module.exports = router;
