// /api/s3-delete/+server.ts
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { RequestHandler } from '@sveltejs/kit';
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

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { key } = await request.json();

        if (!key) {
            return new Response(
                JSON.stringify({ error: 'Key is required' }), 
                { status: 400 }
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        });

        await s3Client.send(command);

        return new Response(
            JSON.stringify({ message: 'Object deleted successfully' }), 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting object:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to delete object' }), 
            { status: 500 }
        );
    }
};