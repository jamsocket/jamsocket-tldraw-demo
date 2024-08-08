import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const BUCKET = process.env.STORAGE_BUCKET
const BUCKET_PREFIX = process.env.STORAGE_PREFIX

const BUCKET_PATH = `${BUCKET_PREFIX}/tldraw-doc.json`

let s3Client: S3Client | null = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
        region: "us-east-1", // Replace with your desired region
    });
} else {
    console.warn("AWS credentials not found. Persistence will be disabled.");
}

export async function writeToS3(data: string) {
    if (!s3Client) {
        return;
    }

    console.log('writing', BUCKET, BUCKET_PATH);

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: BUCKET_PATH,
        Body: data,
    });

    return await s3Client.send(command);
}

export async function readFromS3(): Promise<string | null> {
    if (!s3Client) {
        return null;
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: BUCKET_PATH,
    });

    console.log('reading', BUCKET, BUCKET_PATH);

    try {
        const response = await s3Client.send(command);

        if (response.Body instanceof Readable) {
            const chunks: Buffer[] = [];
            for await (const chunk of response.Body) {
                chunks.push(Buffer.from(chunk));
            }

            return Buffer.concat(chunks).toString('utf-8')
        } else {
            throw new Error("Unexpected response body type");
        }
    } catch (error) {
        if (error instanceof NoSuchKey) {
            console.log(`Object not found.`);
            return null;
        }
        console.error("Error reading from S3:", error);
        throw error;
    }
}
