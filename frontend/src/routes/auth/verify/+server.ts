import { json } from '@sveltejs/kit';
import { confirmSignUp } from '$lib/domains/auth/services/Cognito';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, code } = await request.json();
    await confirmSignUp(username, code);
    return json({ success: true });
  } catch (error: any) {
    return json(
      { 
        success: false, 
        message: error.message || 'Failed to verify account' 
      }, 
      { status: 400 }
    );
  }
};