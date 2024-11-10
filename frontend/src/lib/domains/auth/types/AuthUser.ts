/**
 * Represents a authenticated user in the application with Cognito session details
 */
export default interface AuthUser {
    id: string;
    name: string;
    username: string;  // Add this
    email: string;
    image?: string;
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
}