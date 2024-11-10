// src/lib/domain/auth/services/Cognito.ts

import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } from '$env/static/private';
import {
	AuthenticationDetails,
	CognitoRefreshToken,
	CognitoUser,
	CognitoUserPool,
	CognitoUserSession
} from 'amazon-cognito-identity-js';

export type CognitoUserSessionType = CognitoUserSession;

const CONFIGS = {
	UserPoolId: COGNITO_USER_POOL_ID,
	ClientId: COGNITO_CLIENT_ID
};

// Create a new Cognito User Pool
const Pool = new CognitoUserPool(CONFIGS);

// Wrapper function to create a new Cognito User from the User Pool
const User = (Username: string): CognitoUser => new CognitoUser({ Username, Pool });

/**
 * Login to Cognito User Pool using the provided credentials.
 * This will return the session data at the time of login.
 */
export const getSession = (Username: string, Password: string): Promise<CognitoUserSession> => {
	return new Promise((resolve, reject) =>
		User(Username).authenticateUser(new AuthenticationDetails({ Username, Password }), {
			onSuccess: resolve,
			onFailure: reject
		})
	);
};

/**
 * Refresh the access token of the provided user.
 */
export const refreshAccessToken = async (sessionData: {
	refreshToken: string;
}): Promise<CognitoUserSession> => {
	const cognitoUser = Pool.getCurrentUser();
	// Check if the user is logged in
	if (!cognitoUser) {
		throw new Error('No user found');
	}
	// Refresh the session
	const RefreshToken = new CognitoRefreshToken({
		RefreshToken: sessionData.refreshToken
	});
	return new Promise<CognitoUserSession>((resolve, reject) => {
		cognitoUser.refreshSession(RefreshToken, (err, session: CognitoUserSession) => {
			if (err) {
				reject(err);
			} else {
				resolve(session);
			}
		});
	});
};

// Allow the user to sign up for a new account
export const signUp = (Username: string, Password: string, email: string): Promise<CognitoUser> => {
	console.log('signUp attempt', Username, Password, email);
	const attributeList = [
		{
			Name: 'email',
			Value: email
		}
	];

	return new Promise((resolve, reject) =>
		Pool.signUp(Username, Password, attributeList, [], (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result.user);
			}
		})
	);
};

export const confirmSignUp = (Username: string, code: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		User(Username).confirmRegistration(code, true, (err, result) => {
			if (err) {
				console.error('Confirmation Error:', err);
				reject(err);
			} else {
				resolve();
			}
		});
	});
};

// Sign out
export const signOut = (): void => {
	const cognitoUser = Pool.getCurrentUser();
	if (cognitoUser) {
		cognitoUser.signOut();
	}
};
