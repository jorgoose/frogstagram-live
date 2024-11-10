// src/routes/auth/sign-up/+server.ts
import { json } from '@sveltejs/kit';
import { signUp } from '$lib/domains/auth/services/Cognito';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
      const { username, email, password } = await request.json();
      await signUp(username, password, email);
      return json({ 
        success: true,
        username // Return username for verification page
      });
    } catch (error: any) {
      return json(
        { 
          success: false, 
          message: error.message || 'Failed to create account' 
        }, 
        { status: 400 }
      );
    }
  };