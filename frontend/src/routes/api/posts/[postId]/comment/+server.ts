// src/routes/api/posts/[postId]/comment/+server.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { RequestHandler } from './$types';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'frogstagram-posts';
const REGION = 'us-east-1';

const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

async function getPostMetadata(postId: string) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: `metadata/${postId}/post.json`
    });

    const response = await s3Client.send(command);
    const metadata = await response.Body?.transformToString();
    return JSON.parse(metadata || '{}');
}

async function updatePostMetadata(postId: string, metadata: any) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: `metadata/${postId}/post.json`,
        Body: JSON.stringify(metadata),
        ContentType: 'application/json'
    });
    await s3Client.send(command);
}

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const { username, text } = await request.json();
        if (!username || !text) throw error(400, 'Username and text required');

        const postId = params.postId;
        const post = await getPostMetadata(postId);

        const newComment = {
            id: uuidv4(),
            owner: username,
            text,
            timestamp: new Date().toISOString(),
            likes: { count: 0, users: [] }
        };

        post.comments.push(newComment);
        await updatePostMetadata(postId, post);

        return json({ success: true, comment: newComment });
    } catch (e) {
        console.error('Error adding comment:', e);
        throw error(500, 'Failed to add comment');
    }
};