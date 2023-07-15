import { OAuth2Client } from 'google-auth-library';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Replace with your own Google API Client ID
const client = new OAuth2Client(CLIENT_ID);


const verifyGoogleIdToken = async (idToken) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        console.error('Error verifying Google ID token:', error);
        return null;
    }
};


export default verifyGoogleIdToken;
