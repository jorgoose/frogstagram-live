// src/routes/api/posts/[postId]/like/+server.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { RequestHandler } from './$types';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';
import { error, json } from '@sveltejs/kit';

const BUCKET = 'frogstagram-posts';
const REGION = 'us-east-1';

const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

interface Comment {
    id: string;
    owner: string;
    text: string;
    timestamp: string;
    likes: {
        count: number;
        users: string[];
    };
}

interface PostMetadata {
    comments: Comment[];
    likes: {
        count: number;
        users: string[];
    };
    // Add other fields as necessary
}

async function getPostMetadata(postId: string): Promise<PostMetadata> {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: `metadata/${postId}/post.json`
    });

    const response = await s3Client.send(command);
    const metadata = await response.Body?.transformToString();
    return JSON.parse(metadata || '{}') as PostMetadata;
}

async function updatePostMetadata(postId: string, metadata: PostMetadata) {
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
        const { username } = await request.json();
        if (!username) throw error(400, 'Username required');

        const postId = params.postId;
        const post = await getPostMetadata(postId);

        if (!post.likes.users.includes(username)) {
            post.likes.users.push(username);
            post.likes.count++;
            await updatePostMetadata(postId, post);
        }

        return json({ success: true });
    } catch (e) {
        console.error('Error updating like:', e);
        throw error(500, 'Failed to update like');
    }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
    try {
        const { username } = await request.json();
        if (!username) throw error(400, 'Username required');

        const postId = params.postId;
        const post = await getPostMetadata(postId);

        const userIndex = post.likes.users.indexOf(username);
        if (userIndex !== -1) {
            post.likes.users.splice(userIndex, 1);
            post.likes.count--;
            await updatePostMetadata(postId, post);
        }

        return json({ success: true });
    } catch (e) {
        console.error('Error removing like:', e);
        throw error(500, 'Failed to remove like');
    }
};
