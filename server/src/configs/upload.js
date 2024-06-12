const multer = require("multer");
const fs = require("fs");
const { randomString } = require("../helpers");

const tmpPath = process.cwd() + '/storage/tmp';
const uploadPath = process.cwd() + '/storage/public';

if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath, { recursive: true });
}

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, tmpPath);
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

exports.multerUpload = upload;

exports.uploadPath = uploadPath;