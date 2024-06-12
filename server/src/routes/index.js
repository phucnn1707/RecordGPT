const { Router } = require('express');
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const gptController = require("../controllers/gpt.controller");
const upload = require("../configs/upload")

const otherController = require('../controllers/other.controller');

const router = Router({ mergeParams: true });

router.post('/speech2speech', upload.multerUpload.single('audio'), gptController.Speech2Speech);

router.get('/get-colors', otherController.getColors);

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: 'Hello World'
    });
});
module.exports = router;