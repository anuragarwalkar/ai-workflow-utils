const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Define routes
router.get('/send', emailController.sendEmail);

module.exports = router;
