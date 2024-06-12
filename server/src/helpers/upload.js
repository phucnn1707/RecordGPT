const FileType = require("file-type");
const { multerUpload, uploadPath } = require("@src/configs/upload");
const fs = require("fs");
const { promisify } = require("util");
const mv = require("mv");
const { randomString } = require("@src/helpers");
const { abort } = require("@src/helpers");
const path = require("path");

const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const bucketName = process.env.AWS_BUCKET;
const region = process.env.AWS_DEFAULT_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

const exists = (path) => {
  return new Promise((resolve) => {
    fs.stat(path, (err, stat) => {
      if (err) {
        return resolve(false);
      }
      return resolve(stat.isDirectory());
    });
  });
};

const mkdir = promisify(fs.mkdir);

const move = promisify(mv);

class FileUpload {
  /**
   *
   * @param {Express.Multer.File} file
   * @param {string} type
   */
  constructor(file, type = "bin") {
    this.file = file;
    this.realFileType = type;
  }

  /**
   *
   * @param {string} fieldName
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @returns {Promise<FileUpload | null>}
   */
  static async handleSingleFile(fieldName, req, res) {
    return new Promise((resolve, reject) => {
      multerUpload.single(fieldName)(req, res, (err) => {
        if (err) {
          return reject(err);
        }

        this.clearFile(req, res);

        resolve(req.file ? await(this.fromMulterFile(req.file)) : null);
      });
    });
  }

  /**
   *
   * @param {Express.Request} req
   * @param {Express.Response} res
   */
  static clearFile(req, res) {
    res.on("close", () => {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      if (!req.files) {
        return;
      }

      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).reduce((prev, curr) => {
            prev.push(...curr);
            return prev;
          }, []);

      for (const file of files) {
        fs.unlink(file.path, () => {});
      }
    });
  }

  /**
   *
   * @param {string[]} fields
   * @param {Express.Request} req
   * @param {Express.Response} res
   * @returns {Promise<Array<FileUpload | null | undefined>>}
   */
  static async handleFiles(fields, req, res) {
    return new Promise((resolve, reject) => {
      multerUpload.fields(fields.map((m) => ({ name: m, maxCount: 1 })))(
        req,
        res,
        (err) => {
          if (err) {
            return reject(err);
          }

          this.clearFile(req, res);

          if (!req.files) {
            return resolve([]);
          }

          if (!Array.isArray(req.files)) {
            return resolve(
              Promise.all(
                fields.map((f) =>
                  req.files[f] && req.files[f][0]
                    ? this.fromMulterFile(req.files[f][0])
                    : null
                )
              )
            );
          }

          return resolve(
            Promise.all(
              fields.map((f) =>
                this.fromMulterFile(req.files.find((k) => k.fieldname === f))
              )
            )
          );
        }
      );
    });
  }

  static parseFormData(req, res) {
    return new Promise((resolve, reject) => {
      multerUpload.none()(req, res, (err) => {
        return err ? reject(err) : resolve();
      });
    });
  }

  /**
   *
   * @param {Express.Multer.File} file
   * @returns
   */
  static async getRealFileExtension(file) {
    const result = await FileType.fromFile(file.path);
    return result ? result.ext : "bin";
  }

  /**
   *
   * @param {Express.Multer.File} file
   * @returns {Promise<FileUpload>}
   */
  static async fromMulterFile(file) {
    return new this(file, await this.getRealFileExtension(file));
  }

  async saveFile(path = "") {
    const save = path + "/" + this.file.filename + "." + this.realFileType;
    const full = uploadPath + "/" + save;

    const folder = uploadPath + "/" + path;

    await move(this.file.path, full, { mkdirp: true });

    return save;
  }

  async saveAsBuffer(dir = "") {
    if (this.file) {
      const extension = await FileType.fromBuffer(this.file.buffer);
      //for validate, extension and size
      await this.validateFileSize(this.file);
      await this.validateFilePathExtentions(this.file);

      const fileName = this.file.originalname; 
      
      dir =  dir + "/" + randomString(16) + "-" + Date.now();
      const storagePath = dir + "/" + fileName;
      const fullPath = uploadPath + storagePath;

      const uploadParams = {
        Bucket: bucketName,
        Body: this.file.buffer,
        Key: storagePath,
        ContentType: this.file.mimetype,
        ACL: "public-read"
      };
            
      await s3Client.send(new PutObjectCommand(uploadParams));
      return storagePath;
    }
    return;
  }

  async validateFilePathExtentions(file) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      extension !== ".png" &&
      extension !== ".jpg" &&
      extension !== ".stl" &&
      extension !== ".svg" &&
      extension !== ".heic" 
    ) {
      abort(400, "file is not stl, png, svg, heic or jpg extension");
    }
  }

  async validateFileSize(file) {
    const extension = path.extname(file.originalname);
    if (extension && extension === ".STL" && file.size > 200 * 1024 * 1024) {
      abort(400, "Exceed over 200 MB");
    }
  }
  //temporarily
  static async validateBuffer(file, extensionArr = [], size) {
   
    if (file) {
      const extension = await FileType.fromBuffer(file.buffer);
      if (size && file.size > 200 * 1024) {
        abort(400, "exeeded 200mb");
      }

      if (extensionArr.length && !extensionArr.includes("stl")) {
        abort(400, "file invalid");
      }
    }
  }

  static  removeFile(path) { 
    let fullPath = uploadPath + path 
    fs.exists(fullPath, function(res) {
      if(res) {
        return fs.unlinkSync(fullPath)
      }
      return;
    })
  }
}

exports.uploadFileBuffer = async (file, dir) => {
  const uploadFile = new FileUpload(file);
  let filePath = await uploadFile.saveAsBuffer(dir);
  let fileName = filePath.split("/").pop();

  return {filePath, fileName};
};

exports.uploadBase64 = async (base64, dir) => {
  var matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
  response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  let ext = response.type.split("/")[1];
  let path = dir + "/" + randomString(16) + "-" + Date.now() + "." + (ext ?? ".png");
  // make dir if not exist
  if (!(await exists(uploadPath + "/" + dir))) {
    await mkdir(uploadPath + "/" + dir);
  }
  fs.writeFile(uploadPath + "/" + path, response.data, 'base64', function(err) {
    console.log("ok");
  });
  return path;
};


exports.FileUpload = FileUpload;
exports.exists = exists;
exports.mkdir = mkdir;