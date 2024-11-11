// src/routes/api/images/[...path]/+server.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { RequestHandler } from './$types';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';

const BUCKET = 'frogstagram-posts';
const REGION = 'us-east-1';

const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

export const GET: RequestHandler = async ({ params }) => {
    try {
        const path = params.path;
        
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: path
        });

        const response = await s3Client.send(command);
        
        if (!response.Body) {
            return new Response('Image not found', { status: 404 });
        }

        // Convert readable stream to Uint8Array
        const chunks = [];
        for await (const chunk of response.Body as any) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        return new Response(buffer, {
            headers: {
                'Content-Type': response.ContentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000',
            }
        });

    } catch (error) {
        console.error('Error fetching image:', error);
        return new Response('Failed to fetch image', { status: 500 });
    }
};