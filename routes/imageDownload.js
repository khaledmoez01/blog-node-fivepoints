let express = require('express')
let router = express.Router()
let auth = require('./auth')

// Require controller modules.
let imageDownloadController = require('../controllers/imageDownloadController')

// 22   recuperation d'une image
router.get('/:image_name', auth.required, imageDownloadController.imageDownload_image_get)

module.exports = router
