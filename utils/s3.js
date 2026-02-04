const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

async function uploadToS3(key, body, mimeType) {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: mimeType,
    });

    try {
        await s3Client.send(command);
        const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return { key, url };
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload file to S3');
    }
}

async function getSignedS3Url(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('S3 signed URL error:', error);
        throw new Error('Failed to generate signed URL');
    }
}

async function deleteFromS3(key) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 delete error:', error);
        throw new Error('Failed to delete file from S3');
    }
}

module.exports = { uploadToS3, getSignedS3Url, deleteFromS3 };
