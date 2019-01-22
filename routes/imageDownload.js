let express = require('express');
let router = express.Router();

// Require controller modules.
let imageDownload_controller = require('../controllers/imageDownloadController');

//22   recuperation d'une image
router.get('/:image_name', imageDownload_controller.imageDownload_image_get);  

module.exports = router;