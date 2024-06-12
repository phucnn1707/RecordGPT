const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

module.exports = class S3 {
  constructor(filename, file) {
    this.filename = filename;
    this.file = file;

    this.bucketName = process.env.AWS_BUCKET;
    this.region = process.env.AWS_DEFAULT_REGION;
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  }

  createNewClient() {
    return new S3Client({
      region: this.region,
      credential: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      }
    });
  }

  async getObject() {
    const getParams = {
      Bucket: this.bucketName,
      Key: this.filename
    };

    const s3Client = this.createNewClient();

    return await getSignedUrl(s3Client, new GetObjectCommand(getParams), {
      expiresIn: 300 // 5 minutes
    });
  }

  async putObject() {
    const buffer = await sharp(this.file.buffer).toBuffer();

    const uploadParams = {
      Bucket: this.bucketName,
      Body: buffer,
      Key: this.filename,
      ContentType: this.file.mimetype,
      ACL: 'public-read'
    };

    const s3Client = this.createNewClient();

    return await s3Client.send(new PutObjectCommand(uploadParams));
  }

  async deleteObject() {
    const deleteParams = {
      Bucket: this.bucketName,
      Key: this.filename
    };

    const s3Client = this.createNewClient();

    return await s3Client.send(new DeleteObjectCommand(deleteParams));
  }
};
