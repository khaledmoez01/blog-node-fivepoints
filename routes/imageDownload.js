let express = require('express');
let router = express.Router();
let auth = require('./auth');

// Require controller modules.
let imageDownload_controller = require('../controllers/imageDownloadController');

//22   recuperation d'une image
router.get('/:image_name', auth.required, imageDownload_controller.imageDownload_image_get);  

module.exports = router;