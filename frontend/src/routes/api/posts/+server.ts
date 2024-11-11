// src/routes/api/posts/+server.ts
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';

const BUCKET = 'frogstagram-posts';
const REGION = 'us-east-1';
const PAGE_SIZE = 10;

const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

export const GET: RequestHandler = async ({ url }) => {
    try {
        const cursor = url.searchParams.get('cursor');
        const owner = url.searchParams.get('owner');
        
        // List metadata objects
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: 'metadata/',
            MaxKeys: PAGE_SIZE,
            StartAfter: cursor ? `metadata/${cursor}` : undefined
        });

        const listedObjects = await s3Client.send(listCommand);
        
        if (!listedObjects.Contents) {
            return json({ posts: [], hasMore: false });
        }

        // Fetch each post's metadata
        let posts = await Promise.all(
            listedObjects.Contents
                .filter(obj => obj.Key?.endsWith('post.json'))
                .map(async (obj) => {
                    const getCommand = new GetObjectCommand({
                        Bucket: BUCKET,
                        Key: obj.Key
                    });

                    const response = await s3Client.send(getCommand);
                    const metadata = await response.Body?.transformToString();
                    return JSON.parse(metadata || '{}');
                })
        );

        // Filter by owner if specified
        if (owner) {
            posts = posts.filter(post => post.owner === owner);
        }

        // Sort by timestamp descending
        posts.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return json({
            posts,
            hasMore: listedObjects.IsTruncated
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
        return json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
};