// /api/s3-presigned-url/+server.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
		const { key, contentType } = await request.json();

		if (!key || !contentType) {
			return new Response(JSON.stringify({ error: 'Key and contentType are required' }), {
				status: 400
			});
		}

		const command = new PutObjectCommand({
			Bucket: BUCKET,
			Key: key,
			ContentType: contentType
		});

		const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		return new Response(JSON.stringify({ url: presignedUrl }), { status: 200 });
	} catch (error) {
		console.error('Error generating pre-signed URL:', error);
		return new Response(JSON.stringify({ error: 'Failed to generate pre-signed URL' }), {
			status: 500
		});
	}
};
