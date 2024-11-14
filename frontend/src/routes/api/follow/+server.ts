// src/routes/api/follow/+server.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { RequestHandler } from '@sveltejs/kit';
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

async function getConnectionData(username: string) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: `connections/${username}/data.json`
        });
        const response = await s3Client.send(command);
        const data = await response.Body?.transformToString();
        return JSON.parse(data || '{"followers":[],"following":[]}');
    } catch (e) {
        return { followers: [], following: [] };
    }
}

async function updateConnectionData(username: string, data: any) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: `connections/${username}/data.json`,
        Body: JSON.stringify(data),
        ContentType: 'application/json'
    });
    await s3Client.send(command);
}

export const GET: RequestHandler = async ({ url }) => {
    const username = url.searchParams.get('username');
    if (!username) throw error(400, 'Username required');

    // Get requestor's data for following status
    const userConnectionData = await getConnectionData(username);
    
    // If checking profile data, get that user's followers/following counts
    const profileUsername = url.searchParams.get('profile');
    if (profileUsername) {
        const profileData = await getConnectionData(profileUsername);
        return json({
            following: userConnectionData.following,
            stats: {
                followers: profileData.followers.length,
                following: profileData.following.length
            }
        });
    }

    return json(userConnectionData);
};

export const POST: RequestHandler = async ({ request }) => {
    const { follower, following } = await request.json();
    if (!follower || !following) throw error(400, 'Both users required');

    // Get both users' data
    const followerData = await getConnectionData(follower);
    const followingData = await getConnectionData(following);

    // Update following list
    if (!followerData.following.includes(following)) {
        followerData.following.push(following);
        await updateConnectionData(follower, followerData);
    }

    // Update followers list
    if (!followingData.followers.includes(follower)) {
        followingData.followers.push(follower);
        await updateConnectionData(following, followingData);
    }

    return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request }) => {
    const { follower, following } = await request.json();
    if (!follower || !following) throw error(400, 'Both users required');

    // Get both users' data
    const followerData = await getConnectionData(follower);
    const followingData = await getConnectionData(following);

    // Remove from following list
    followerData.following = followerData.following.filter((u: string) => u !== following);
    await updateConnectionData(follower, followerData);

    // Remove from followers list
    followingData.followers = followingData.followers.filter((u: string) => u !== follower);
    await updateConnectionData(following, followingData);

    return json({ success: true });
};