import type { RequestHandler } from '@sveltejs/kit';

const API_URL = 'https://etvgap7uqg.execute-api.us-east-1.amazonaws.com';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse the request body from the client
		const { bucket, key } = await request.json();

		// Make the POST request to the Lambda endpoint
		const lambdaResponse = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ bucket, key })
		});

		if (!lambdaResponse.ok) {
			return new Response(JSON.stringify({ error: 'Failed to call Lambda function' }), {
				status: lambdaResponse.status
			});
		}

		// Parse the response from Lambda
		const data = await lambdaResponse.json();
		return new Response(JSON.stringify(data), { status: 200 });
	} catch (error) {
		console.error('Error calling Lambda function:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
	}
};
